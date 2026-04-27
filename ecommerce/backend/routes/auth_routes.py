from flask import Blueprint, request, jsonify
from functools import wraps
from services.services import AuthService

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    user, err = auth_service.register(data.get('name'), data.get('email'), data.get('password'), data.get('role','client'))
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'user': user}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user, err = auth_service.login(data.get('email'), data.get('password'))
    if err:
        return jsonify({'error': err}), 401
    return jsonify({'user': user}), 200
