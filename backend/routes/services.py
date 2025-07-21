from flask import Blueprint, jsonify
from pymongo import MongoClient

services_bp = Blueprint('services', __name__)

client = MongoClient('mongodb://localhost:27017')
db = client['app_archive']
users_collection = db['users']
documents_collection = db['documents']

@services_bp.route('/api/services', methods=['GET'])
def get_services():
    try:
        services = users_collection.distinct('service')
        # Optionnel : filtrer les valeurs vides ou nulles
        services = [s for s in services if s]
        return jsonify(services), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@services_bp.route('/api/users/by-service/<service_name>', methods=['GET'])
def get_users_by_service(service_name):
    try:
        users = list(users_collection.find(
            {"service": service_name},
            {"_id": 0, "username": 1}
        ))
        usernames = [user["username"] for user in users]
        return jsonify(usernames), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@services_bp.route('/api/files/by-user/<username>', methods=['GET'])
def get_files_by_user(username):
    try:
        files = list(documents_collection.find(
            {"uploaded_by": username},
            {"_id": 1, "filename": 1, "title": 1}
        ))
        # Transformer l'_id en string pour JSON
        for f in files:
            f["_id"] = str(f["_id"])
        return jsonify(files), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
