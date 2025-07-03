from flask import Flask, request, jsonify
from flask_cors import CORS
from models.user_model import connect_user  # Import de la fonction pour enregistrer un utilisateur
from routes.files import files_bp
from routes.admin_routes import admin_bp  
from routes.auth import auth_bp 

app = Flask(__name__)
CORS(app)

# Enregistrement des blueprints
app.register_blueprint(files_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(auth_bp)

# Optionnel : cette route d’inscription pourrait être déplacée dans auth.py
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
    app.run(debug=True)
