from flask import Blueprint, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token  # <-- importer ça

auth_bp = Blueprint('auth', __name__)
CORS(auth_bp)

client = MongoClient('mongodb://localhost:27017')
db = client['app_archive']
users_collection = db['users']

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Champs requis manquants"}), 400

    user = users_collection.find_one({"username": username})

    if not user or not check_password_hash(user['password'], password):
        return jsonify({"message": "Identifiants invalides"}), 401

    # Créer un token JWT avec l'identité = username
    access_token = create_access_token(identity=username)

    return jsonify({
        "message": "Connexion réussie",
        "token": access_token,           # <-- ici tu envoies le token
        "role": user.get("role", "user"),
        "username": username,
        "service": user.get("service", "")
    }), 200
