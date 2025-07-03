from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from flask_cors import CORS

admin_bp = Blueprint('admin', __name__)
CORS(admin_bp)

client = MongoClient('mongodb://localhost:27017')
db = client['app_archive']
users_collection = db['users']

@admin_bp.route('/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')  # "admin" ou "user"

    if not username or not password or not role:
        return jsonify({"error": "Champs manquants"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Utilisateur déjà existant"}), 409

    hashed_pw = generate_password_hash(password)

    users_collection.insert_one({
        "username": username,
        "password": hashed_pw,
        "role": role
    })

    return jsonify({"message": f"✅ Utilisateur '{username}' ajouté avec succès"}), 201
