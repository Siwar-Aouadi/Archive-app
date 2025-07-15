from flask import Blueprint, request, jsonify, send_file, current_app
from pymongo import MongoClient
import os
import io
import re
import zipfile
from datetime import datetime
from werkzeug.utils import secure_filename
from services.gridfs_service import (
    compress_file,
    save_to_gridfs,
    get_file_from_gridfs,
    delete_file_from_gridfs
)

files_bp = Blueprint('files', __name__)

# Connexion MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["app_archive"]
documents_collection = db["documents"]
users_collection = db["users"]
categories_collection = db["categories"]

# 📤 Upload d’un document compressé
@files_bp.route('/upload', methods=['POST'])
def upload_file():
    uploaded = request.files.get('file')
    title    = request.form.get('title')
    category = request.form.get('category')
    username = request.form.get('username')

    # Validation des champs
    if not uploaded or not title or not category or not username:
        return jsonify({"error": "❌ Tous les champs sont requis"}), 400

    # Vérifier que la catégorie existe
    if not categories_collection.find_one({"name": category}):
        return jsonify({"error": "❌ Catégorie inexistante"}), 400

    # Récupérer le service de l'utilisateur
    user = users_collection.find_one({"username": username})
    service = user.get("service", "Autres")

    # Générer le nom de fichier : YYYY_MM_DD_service_categorie_titre_utilisateur.ext
    date_str   = datetime.now().strftime("%Y_%m_%d")
    ext        = os.path.splitext(secure_filename(uploaded.filename))[1]
    safe_title = re.sub(r'[^A-Za-z0-9_-]', '_', title.strip())
    safe_cat   = re.sub(r'[^A-Za-z0-9_-]', '_', category.strip())
    new_name   = f"{date_str}_{service}_{safe_cat}_{safe_title}_{username}{ext}"
    zip_name   = new_name.rsplit('.', 1)[0] + ".zip"

    # Lire et compresser en mémoire
    raw_data   = uploaded.read()
    zip_buf    = io.BytesIO()
    with zipfile.ZipFile(zip_buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(new_name, raw_data)
    zip_data = zip_buf.getvalue()

    # Sauvegarder dans GridFS (optionnel) ou directement en base
    fs      = current_app.config['FS']
    file_id = save_to_gridfs(fs, zip_buf, zip_name)

    # Insérer le document
    documents_collection.insert_one({
        "title":           title,
        "category":        category,
        "service":         service,
        "uploaded_by":     username,
        "filename":        zip_name,
        "file_id":         str(file_id),
        "file_data":       zip_data,
        "original_size":   len(raw_data),
        "compressed_size": len(zip_data),
        "upload_date":     datetime.now()
    })

    return jsonify({
        "message":  "✅ Fichier compressé et enregistré avec succès",
        "filename": zip_name
    }), 200


# 📄 Lister les documents
@files_bp.route('/documents', methods=['GET'])
def list_documents():
    username = request.args.get('username')
    role     = request.args.get('role')
    service  = request.args.get('service')  # pour filtrage côté client

    query = {}
    if role != "admin" and service:
        # l'utilisateur ne voit que les fichiers de son service
        query["service"] = service

    docs = documents_collection.find(
        query,
        {"_id": 0, "title": 1, "category": 1, "service": 1,
         "uploaded_by": 1, "filename": 1, "upload_date": 1}
    ).sort("upload_date", -1)

    # Formatter la date
    out = []
    for d in docs:
        d["upload_date"] = d["upload_date"].strftime("%Y-%m-%d %H:%M:%S")
        out.append(d)
    return jsonify(out), 200


# 📂 Gérer les catégories
@files_bp.route('/categories', methods=['GET'])
def get_categories():
    cats = categories_collection.find({}, {"_id": 0, "name": 1})
    return jsonify([c["name"] for c in cats]), 200

@files_bp.route('/categories', methods=['POST'])
def add_category():
    name = request.form.get('name')
    role = request.form.get('role')
    if role != "admin":
        return jsonify({"error": "❌ Non autorisé"}), 403
    if not name:
        return jsonify({"error": "❌ Nom requis"}), 400
    if categories_collection.find_one({"name": name}):
        return jsonify({"error": "❌ Catégorie déjà existante"}), 400
    categories_collection.insert_one({"name": name})
    return jsonify({"message": "✅ Catégorie ajoutée"}), 201


# 📥 Télécharger (dézipper en mémoire)
@files_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    doc = documents_collection.find_one({"filename": filename})
    if not doc:
        return jsonify({"error": "❌ Fichier non trouvé"}), 404

    zip_data = doc.get("file_data")
    if not zip_data:
        return jsonify({"error": "❌ Aucune donnée disponible"}), 404

    with zipfile.ZipFile(io.BytesIO(zip_data), 'r') as zf:
        names = zf.namelist()
        if not names:
            return jsonify({"error": "❌ Fichier vide"}), 500
        content = zf.read(names[0])

    return send_file(
        io.BytesIO(content),
        as_attachment=True,
        download_name=names[0]
    )


# ❌ Supprimer un document
@files_bp.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    username = request.args.get('username')
    role     = request.args.get('role')

    doc = documents_collection.find_one({"filename": filename})
    if not doc:
        return jsonify({"error": "❌ Fichier non trouvé"}), 404
    if role != "admin" and doc.get("uploaded_by") != username:
        return jsonify({"error": "❌ Non autorisé"}), 403

    documents_collection.delete_one({"filename": filename})
    return jsonify({"message": "✅ Fichier supprimé"}), 200


# ✏️ Remplacer un document
@files_bp.route('/update/<filename>', methods=['PUT'])
def update_file(filename):
    # Récupérer l’utilisateur et son rôle
    username = request.form.get('username')
    role     = request.form.get('role')
    new_file = request.files.get('file')

    # Vérifier que le fichier existe en base
    doc = documents_collection.find_one({"filename": filename})
    if not doc:
        return jsonify({"error": "❌ Fichier non trouvé"}), 404

    # Vérifier les droits
    if role != "admin" and doc.get("uploaded_by") != username:
        return jsonify({"error": "❌ Non autorisé"}), 403

    if not new_file:
        return jsonify({"error": "❌ Aucun fichier reçu"}), 400

    # On récupère les metadata d'origine
    title    = doc.get("title")
    category = doc.get("category")
    service  = doc.get("service")
    uploader = doc.get("uploaded_by")

    # Générer le nouveau nom : YYYY_MM_DD_service_categorie_titre_utilisateur.ext
    date_str   = datetime.now().strftime("%Y_%m_%d")
    ext        = os.path.splitext(secure_filename(new_file.filename))[1]
    safe_title = re.sub(r'[^A-Za-z0-9_-]', '_', title.strip())
    safe_cat   = re.sub(r'[^A-Za-z0-9_-]', '_', category.strip())
    new_name   = f"{date_str}_{service}_{safe_cat}_{safe_title}_{uploader}{ext}"
    zip_name   = new_name.rsplit('.', 1)[0] + ".zip"

    # Lire et re‑compresser en mémoire
    raw_data = new_file.read()
    buf      = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(new_name, raw_data)
    zip_data = buf.getvalue()

    # (Optionnel) mettre à jour GridFS si vous l'utilisez
    fs      = current_app.config['FS']
    file_id = save_to_gridfs(fs, buf, zip_name)

    # Mettre à jour le document en base
    documents_collection.update_one(
        {"filename": filename},
        {"$set": {
            "filename":        zip_name,
            "file_data":       zip_data,
            "file_id":         str(file_id),
            "upload_date":     datetime.now()
        }}
    )

    return jsonify({
        "message":  "✅ Fichier remplacé avec succès",
        "filename": zip_name
    }), 200
