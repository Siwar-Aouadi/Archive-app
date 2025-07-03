from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import os
from flask import send_from_directory

files_bp = Blueprint('files', __name__)

# Connexion MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["app_archive"]
documents_collection = db["documents"]

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@files_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier reçu"}), 400

    file = request.files['file']
    title = request.form.get('title')
    description = request.form.get('description')

    if file.filename == '' or not title or not description:
        return jsonify({"error": "Champs manquants"}), 400

    # Sauvegarder le fichier localement
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # Sauvegarder les métadonnées dans MongoDB
    documents_collection.insert_one({
        "title": title,
        "description": description,
        "filename": file.filename,
        "path": filepath  # facultatif, utile si tu veux localiser le fichier
    })

    return jsonify({
        "message": "Fichier et données enregistrés avec succès",
        "filename": file.filename
    }), 200


@files_bp.route('/documents', methods=['GET'])
def list_documents():
    documents = documents_collection.find({}, {"_id": 0})  # Ne pas retourner l'_id
    doc_list = list(documents)
    return jsonify(doc_list), 200



@files_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
