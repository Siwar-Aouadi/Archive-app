from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from flask_cors import CORS

admin_bp = Blueprint('admin', __name__)
CORS(admin_bp)

client = MongoClient('mongodb://localhost:27017')
db = client['app_archive']
users_collection = db['users']

# ➕ Ajouter un utilisateur
@admin_bp.route('/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    email = data.get('email')
    phone = data.get('phone')
    service = data.get('service')

    if not username or not password or not role:
        return jsonify({"error": "Champs manquants"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Utilisateur déjà existant"}), 409

    hashed_pw = generate_password_hash(password)
    users_collection.insert_one({
        "username": username,
        "password": hashed_pw,
        "role": role,
        "email": email,
        "phone": phone,
        "service": service
    })

    return jsonify({"message": f"✅ Utilisateur '{username}' ajouté"}), 201

# 🔁 Modifier un utilisateur
@admin_bp.route('/edit_user/<username>', methods=['PUT'])
def edit_user(username):
    data = request.get_json()
    new_data = {
        "email": data.get("email"),
        "phone": data.get("phone"),
        "service": data.get("service"),
        "role": data.get("role")
    }

    if data.get("password"):
        new_data["password"] = generate_password_hash(data.get("password"))

    result = users_collection.update_one({"username": username}, {"$set": new_data})
    if result.modified_count == 0:
        return jsonify({"error": "Aucune modification effectuée"}), 404
    return jsonify({"message": f"✅ Utilisateur '{username}' modifié"}), 200

# ❌ Supprimer un utilisateur
@admin_bp.route('/delete_user/<username>', methods=['DELETE'])
def delete_user(username):
    result = users_collection.delete_one({"username": username})
    if result.deleted_count == 0:
        return jsonify({"error": "Utilisateur introuvable"}), 404
    return jsonify({"message": f"🗑 Utilisateur '{username}' supprimé"}), 200

# 📋 Récupérer la liste des utilisateurs
@admin_bp.route('/users', methods=['GET'])
def get_users():
    users = list(users_collection.find({}, {"_id": 0, "password": 0}))
    return jsonify(users), 200
