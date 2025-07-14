from flask import Blueprint, request, jsonify, send_file
from pymongo import MongoClient
import os
import re
import zipfile
import io
from datetime import datetime

files_bp = Blueprint('files', __name__)

client = MongoClient("mongodb://localhost:27017/")
db = client["app_archive"]
documents_collection = db["documents"]
categories_collection = db["categories"]  # ✅ Nouvelle collection

# ✅ Upload avec nom formaté et catégorie choisie
@files_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "❌ Aucun fichier reçu"}), 400

    file = request.files['file']
    username = request.form.get('username')
    service = request.form.get('service')
    titre = request.form.get('titre')
    category = request.form.get('category')

    if not all([file, username, service, titre, category]):
        return jsonify({"error": "❌ Tous les champs sont requis"}), 400

    # ✅ Vérifie que la catégorie existe dans MongoDB
    if not categories_collection.find_one({"name": category}):
        return jsonify({"error": "❌ Catégorie inexistante"}), 400

    extension = os.path.splitext(file.filename)[1]
    date_str = datetime.now().strftime('%Y_%m_%d')
    cleaned_title = re.sub(r'[^a-zA-Z0-9\s-]', '', titre).strip().replace(" ", "_")

    final_name = f"{date_str} {service}_{category}_{cleaned_title}{extension}"
    zip_filename = final_name.replace(extension, ".zip")

    file_content = file.read()
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr(final_name, file_content)
    zip_data = zip_buffer.getvalue()

    documents_collection.insert_one({
        "filename": zip_filename,
        "uploaded_by": username,
        "file_data": zip_data,
        "category": category,
        "title": titre,
        "service": service
    })

    return jsonify({
        "message": "✅ Fichier compressé et enregistré avec succès",
        "filename": zip_filename
    }), 200

# 📄 Lister les documents (admin voit tout, user voit son service)
@files_bp.route('/documents', methods=['GET'])
def list_documents():
    username = request.args.get("username")
    role = request.args.get("role")
    service = request.args.get("service")

    query = {}
    if role != "admin" and service:
        query = {"filename": {"$regex": f" {service}_"}}

    docs = documents_collection.find(query, {"_id": 0, "title": 1, "description": 1, "filename": 1, "uploaded_by": 1, "category": 1})
    return jsonify(list(docs)), 200

# ✅ Lister toutes les catégories
@files_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = categories_collection.find({}, {"_id": 0, "name": 1})
        return jsonify([cat['name'] for cat in categories]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Ajouter une catégorie (admin uniquement)
@files_bp.route('/categories', methods=['POST'])
def add_category():
    name = request.form.get('name')
    role = request.form.get('role')

    if role != "admin":
        return jsonify({"error": "Non autorisé"}), 403

    if not name:
        return jsonify({"error": "Nom requis"}), 400

    if categories_collection.find_one({"name": name}):
        return jsonify({"error": "Catégorie déjà existante"}), 400

    categories_collection.insert_one({"name": name})
    return jsonify({"message": "✅ Catégorie ajoutée"}), 201

# 📥 Télécharger un fichier compressé
@files_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    doc = documents_collection.find_one({"filename": filename})
    if not doc:
        return jsonify({"error": "Fichier non trouvé"}), 404

    zip_data = doc.get("file_data")
    if not zip_data:
        return jsonify({"error": "Aucune donnée trouvée"}), 404

    with zipfile.ZipFile(io.BytesIO(zip_data), 'r') as zipf:
        extracted_names = zipf.namelist()
        if not extracted_names:
            return jsonify({"error": "Fichier vide"}), 500
        extracted_file = zipf.read(extracted_names[0])
        return send_file(
            io.BytesIO(extracted_file),
            as_attachment=True,
            download_name=extracted_names[0]
        )

# ❌ Supprimer un fichier
@files_bp.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    username = request.args.get('username')
    role = request.args.get('role')

    doc = documents_collection.find_one({"filename": filename})
    if not doc:
        return jsonify({"error": "Fichier non trouvé"}), 404

    if role != "admin" and doc.get("uploaded_by") != username:
        return jsonify({"error": "Non autorisé à supprimer ce fichier"}), 403

    documents_collection.delete_one({"filename": filename})
    return jsonify({"message": "✅ Fichier supprimé"}), 200

# ✏️ Remplacer un fichier par un nouveau
@files_bp.route('/update/<filename>', methods=['PUT'])
def update_file(filename):
    username = request.form.get('username')
    role = request.form.get('role')
    file = request.files.get('file')

    doc = documents_collection.find_one({"filename": filename})
    if not doc:
        return jsonify({"error": "Fichier non trouvé"}), 404

    if role != "admin" and doc.get("uploaded_by") != username:
        return jsonify({"error": "Non autorisé à modifier ce fichier"}), 403

    if not file:
        return jsonify({"error": "Aucun fichier reçu"}), 400

    new_filename = file.filename
    pattern = r'^\d{4}_\d{2}_\d{2} [\w\s-]+_[\w\s-]+_[\w\s-]+\.[a-zA-Z0-9]+$'
    if not re.match(pattern, new_filename):
        return jsonify({"error": "❌ Nom de fichier invalide"}), 400

    file_content = file.read()
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr(new_filename, file_content)
    zip_data = zip_buffer.getvalue()
    zip_name = new_filename.rsplit('.', 1)[0] + '.zip'

    documents_collection.update_one(
        {"filename": filename},
        {"$set": {
            "filename": zip_name,
            "file_data": zip_data
        }}
    )

    return jsonify({"message": "✅ Fichier remplacé avec succès"}), 200

# ❌ Supprimer tous les fichiers d'une catégorie
@files_bp.route("/delete_category/<category_name>", methods=["DELETE"])
def delete_category(category_name):
    username = request.args.get("username")
    role = request.args.get("role")

    if role != "admin":
        return jsonify({"error": "Non autorisé"}), 403

    deleted_files = []
    for doc in documents_collection.find({"category": category_name}):
        documents_collection.delete_one({"_id": doc["_id"]})
        deleted_files.append(doc["filename"])

    return jsonify({
        "message": f"✅ {len(deleted_files)} fichier(s) supprimé(s) de la catégorie '{category_name}'"
    }), 200
