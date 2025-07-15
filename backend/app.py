from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_pymongo import PyMongo
from gridfs import GridFS
import os
from bson import ObjectId

from models.user_model import connect_user

app = Flask(
    __name__,
    static_folder='static',
    static_url_path=''
)

CORS(app)

# Configuration MongoDB
app.config["MONGO_URI"] = "mongodb://localhost:27017/app_archive"
mongo = PyMongo(app)

# Initialisation GridFS
fs = GridFS(mongo.db)
app.config['FS'] = fs
app.config['MONGO_DB'] = mongo.db  # optionnel pour d'autres blueprints

# 🧩 Enregistrement des blueprints après config FS
from routes.files import files_bp
from routes.admin_routes import admin_bp  
from routes.auth import auth_bp 

app.register_blueprint(files_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(auth_bp)

# Serveur frontend (React SPA)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Inscription utilisateur
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Champs vides"}), 400

    connect_user(username, password)
    print("Utilisateur enregistré :", username)
    return jsonify({"message": "Inscription réussie"}), 201

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    try:
        mongo.db.command('ping')
        return jsonify({
            "status": "healthy",
            "mongo": "connected",
            "gridfs": "ready"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# Démarrage de l'app
if __name__ == '__main__':
    with app.app_context():
        try:
            mongo.db.documents.create_index("filename", unique=True)
            mongo.db.documents.create_index("uploaded_by")
            mongo.db.documents.create_index("upload_date")
            print("✅ Index MongoDB créés avec succès")
        except Exception as e:
            print(f"❌ Erreur indexation MongoDB : {str(e)}")

    app.run(debug=True, host='0.0.0.0', port=5000)
