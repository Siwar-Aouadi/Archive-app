from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

client = MongoClient("mongodb://localhost:27017")
db = client["app_archive"]
users_collection = db["users"]

def connect_user(username, password, role="user"):
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        "username": username,
        "password": hashed_password,
        "role": role
    })

def find_user(username):
    return users_collection.find_one({"username": username})

def check_user_password(username, password):
    user = find_user(username)
    if not user:
        return False
    return check_password_hash(user["password"], password)
