from flask import Blueprint, request, jsonify, send_file, send_from_directory
from pymongo import MongoClient
import os
import re
from datetime import datetime
import zipfile
import shutil

files_bp = Blueprint('files', __name__)

client = MongoClient("mongodb://localhost:27017/")
db = client["app_archive"]
documents_collection = db["documents"]

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
COMPRESSED_FOLDER = os.path.join(os.getcwd(), "compressed")
TEMP_EXTRACT_FOLDER = os.path.join(os.getcwd(), "temp_extract")

# Créer les dossiers si n'existent pas
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COMPRESSED_FOLDER, exist_ok=True)
os.makedirs(TEMP_EXTRACT_FOLDER, exist_ok=True)

# 📤 Upload d’un fichier avec compression
@files_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier reçu"}), 400

    file = request.files['file']
    title = request.form.get('title')
    description = request.form.get('description')
    username = request.form.get('username')  # 🔒 Important

    if not file.filename or not title or not description or not username:
        return jsonify({"error": "Champs manquants"}), 400

    filename = file.filename
    pattern = r'^\d{4}_\d{2}_\d{2} [\w\s-]+\.[a-zA-Z0-9]+$'
    if not re.match(pattern, filename):
        return jsonify({"error": "❌ Nom de fichier invalide. Format requis : AAAA_MM_JJ source.extension"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # --- Compression ---
    zip_name = filename.rsplit('.', 1)[0] + '.zip'  # Même nom mais extension zip
    zip_path = os.path.join(COMPRESSED_FOLDER, zip_name)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(filepath, arcname=filename)

    # Obtenir la taille originale et compressée
    try:
        original_size = os.path.getsize(filepath)
    except:
        original_size = 0
    compressed_size = os.path.getsize(zip_path)

    # Affichage dans le terminal
    print(f"🗃️ Taille fichier original : {original_size / 1024:.2f} Ko")
    print(f"📦 Taille fichier compressé : {compressed_size / 1024:.2f} Ko")

    # Supprimer le fichier original après compression pour ne garder que le zip
    try:
        os.remove(filepath)
    except Exception as e:
        print("Erreur suppression fichier original après compression :", e)

    # Enregistrer dans MongoDB le zip
    documents_collection.insert_one({
        "title": title,
        "description": description,
        "filename": zip_name,
        "path": zip_path,
        "uploaded_by": username
    })

    return jsonify({
        "message": "✅ Fichier compressé et enregistré avec succès",
        "filename": zip_name,
        "original_size_kb": round(original_size / 1024, 2),
        "compressed_size_kb": round(compressed_size / 1024, 2)
    }), 200

# 📄 Lister tous les fichiers (inchangé)
@files_bp.route('/documents', methods=['GET'])
def list_documents():
    documents = documents_collection.find({}, {"_id": 0, "title": 1, "description":1, "filename":1, "uploaded_by":1})
    return jsonify(list(documents)), 200


# 📁 Fichiers regroupés par source (inchangé)
@files_bp.route('/documents/grouped', methods=['GET'])
def list_documents_grouped():
    documents = documents_collection.find({}, {"_id": 0, "filename": 1})
    grouped = {}

    for doc in documents:
        filename = doc["filename"]
        try:
            source_part = filename.split(" ", 1)[1]
            source_name = os.path.splitext(source_part)[0]
        except:
            source_name = "Autres"

        if source_name not in grouped:
            grouped[source_name] = []
        grouped[source_name].append(filename)

    return jsonify(grouped), 200


# 📥 Télécharger un fichier avec décompression temporaire
@files_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    # Chercher dans MongoDB le chemin du zip
    file_doc = documents_collection.find_one({"filename": filename})
    if not file_doc:
        return jsonify({"error": "Fichier non trouvé"}), 404

    zip_path = file_doc.get('path')
    if not os.path.exists(zip_path):
        return jsonify({"error": "Fichier compressé non trouvé sur le serveur"}), 404

    # Nettoyer dossier temporaire extraction
    if os.path.exists(TEMP_EXTRACT_FOLDER):
        shutil.rmtree(TEMP_EXTRACT_FOLDER)
    os.makedirs(TEMP_EXTRACT_FOLDER, exist_ok=True)

    # Extraction du zip dans dossier temporaire
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(TEMP_EXTRACT_FOLDER)

    # Normalement un seul fichier à extraire
    extracted_files = os.listdir(TEMP_EXTRACT_FOLDER)
    if not extracted_files:
        return jsonify({"error": "Erreur lors de la décompression"}), 500

    extracted_file_path = os.path.join(TEMP_EXTRACT_FOLDER, extracted_files[0])

    # Envoyer le fichier décompressé
    return send_file(extracted_file_path, as_attachment=True)


# ❌ Supprimer un fichier (modifié pour supprimer zip)
@files_bp.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    username = request.args.get('username')
    role = request.args.get('role')

    file_doc = documents_collection.find_one({"filename": filename})
    if not file_doc:
        return jsonify({"error": "Fichier non trouvé"}), 404

    if role != "admin" and file_doc.get("uploaded_by") != username:
        return jsonify({"error": "Non autorisé à supprimer ce fichier"}), 403

    try:
        os.remove(file_doc["path"])
    except Exception as e:
        print("Erreur suppression fichier :", e)

    documents_collection.delete_one({"filename": filename})
    return jsonify({"message": "✅ Fichier supprimé"}), 200


# ✏️ Modifier un fichier (inchangé)
@files_bp.route('/update/<filename>', methods=['PUT'])
def update_file(filename):
    username = request.args.get('username')
    role = request.args.get('role')

    file_doc = documents_collection.find_one({"filename": filename})
    if not file_doc:
        return jsonify({"error": "Fichier non trouvé"}), 404

    if role != "admin" and file_doc.get("uploaded_by") != username:
        return jsonify({"error": "Non autorisé à modifier ce fichier"}), 403

    data = request.get_json()
    new_title = data.get("title")
    new_description = data.get("description")

    update_fields = {}
    if new_title:
        update_fields["title"] = new_title
    if new_description:
        update_fields["description"] = new_description

    documents_collection.update_one({"filename": filename}, {"$set": update_fields})
    return jsonify({"message": "✅ Fichier mis à jour"}), 200
