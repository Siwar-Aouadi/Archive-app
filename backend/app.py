from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

from models.user_model import connect_user
from routes.files import files_bp
from routes.admin_routes import admin_bp  
from routes.auth import auth_bp 

app = Flask(
    __name__,
    static_folder='static',       # dossier où tu mettras le build React
    static_url_path=''            # pour que l'URL soit propre sans /static/
)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Enregistrement des blueprints
app.register_blueprint(files_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(auth_bp)

# Serve React build (index.html et les fichiers statiques)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# API pour l'enregistrement
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
