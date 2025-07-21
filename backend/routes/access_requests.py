from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity

access_requests_bp = Blueprint('access_requests', __name__)

# Connexion MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["app_archive"]
access_requests_collection = db["access_requests"]

@access_requests_bp.route('/api/access/request-access', methods=['POST'])
@jwt_required()
def request_access():
    data = request.get_json()
    current_user = get_jwt_identity()

    # Vérifie s'il y a déjà une demande en attente ou acceptée
    existing = access_requests_collection.find_one({
        'file_id': data['file_id'],
        'requested_by': current_user,
        'status': {'$in': ['pending', 'accepted']}
    })

    if existing:
        return jsonify({'message': 'Vous avez déjà une demande en cours ou acceptée'}), 400

    access_requests_collection.insert_one({
        'file_id': data['file_id'],
        'owner_id': data['owner_id'],
        'requested_by': current_user,
        'title': data['title'],
        'status': 'pending'
    })

    return jsonify({'message': 'Demande envoyée'}), 201

@access_requests_bp.route('/api/access/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    current_user = get_jwt_identity()
    requests = list(access_requests_collection.find({'requested_by': current_user}))
    for r in requests:
        r['_id'] = str(r['_id'])
    return jsonify(requests)

@access_requests_bp.route('/api/access/received-requests', methods=['GET'])
@jwt_required()
def get_received_requests():
    current_user = get_jwt_identity()
    requests = list(access_requests_collection.find({'owner_id': current_user}))
    for r in requests:
        r['_id'] = str(r['_id'])
    return jsonify(requests)

@access_requests_bp.route('/api/access/respond-request/<request_id>', methods=['POST'])
@jwt_required()
def respond_request(request_id):
    decision = request.json.get('decision')
    if decision not in ['accepted', 'rejected']:
        return jsonify({'error': 'Décision invalide'}), 400

    access_requests_collection.update_one(
        {'_id': ObjectId(request_id)},
        {'$set': {'status': decision}}
    )

    return jsonify({'message': f'Requête {decision}'}), 200

# ✅ Nouvelle route pour vérifier l'autorisation de téléchargement
@access_requests_bp.route('/api/access/can-download/<file_id>', methods=['GET'])
@jwt_required()
def can_download(file_id):
    current_user = get_jwt_identity()
    request_doc = access_requests_collection.find_one({
        'file_id': file_id,
        'requested_by': current_user,
        'status': 'accepted'
    })

    if request_doc:
        return jsonify({'authorized': True}), 200
    else:
        return jsonify({'authorized': False, 'message': 'Téléchargement non autorisé'}), 403
