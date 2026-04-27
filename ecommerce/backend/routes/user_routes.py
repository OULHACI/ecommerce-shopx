from flask import Blueprint, request, jsonify
from services.services import UserService

user_bp = Blueprint('users', __name__)
user_service = UserService()

def get_user():
    user_id = request.headers.get('X-User-Id')
    user_role = request.headers.get('X-User-Role')
    if not user_id:
        return None
    return {'id': int(user_id), 'role': user_role}

@user_bp.route('/', methods=['GET'])
def get_users():
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'users': user_service.get_all()})

@user_bp.route('/<int:user_id>/role', methods=['PUT'])
def update_role(user_id):
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    role = request.json.get('role')
    user_service.update_role(user_id, role)
    return jsonify({'success': True})

@user_bp.route('/<int:user_id>/toggle-status', methods=['PUT'])
def toggle_status(user_id):
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    user_service.toggle_status(user_id)
    return jsonify({'success': True})
