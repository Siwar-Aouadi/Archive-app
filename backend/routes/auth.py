from flask import Blueprint, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import check_password_hash

# Définir le blueprint
auth_bp = Blueprint('auth', __name__)
CORS(auth_bp)  # 🔐 Autoriser les requêtes cross-origin pour ce blueprint

# Connexion à la base MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['app_archive']
users_collection = db['users']

# Route de connexion (login)
@auth_bp.route('/login', methods=['POST', 'OPTIONS'])  # ✅ inclure OPTIONS
def login():
    if request.method == 'OPTIONS':
        # Répondre à la pré-demande CORS sans erreur
        return jsonify({'status': 'ok'}), 200

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Champs requis manquants"}), 400

    user = users_collection.find_one({"username": username})

    if not user or not check_password_hash(user['password'], password):
        return jsonify({"message": "Identifiants invalides"}), 401

    return jsonify({
        "message": "Connexion réussie",
        "role": user.get("role", "user"),  # 🛡️ renvoie aussi le rôle
        "username": username
    }), 200
