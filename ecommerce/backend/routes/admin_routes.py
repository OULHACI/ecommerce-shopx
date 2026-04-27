from flask import Blueprint, request, jsonify
from services.services import AdminService

admin_bp = Blueprint('admin', __name__)
admin_service = AdminService()

def get_user():
    user_id = request.headers.get('X-User-Id')
    user_role = request.headers.get('X-User-Role')
    if not user_id:
        return None
    return {'id': int(user_id), 'role': user_role}

@admin_bp.route('/analytics', methods=['GET'])
def analytics():
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(admin_service.get_analytics())

@admin_bp.route('/notify', methods=['POST'])
def send_notification():
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    admin_service.send_notification(data.get('user_id', 'all'), data.get('message'))
    return jsonify({'success': True})
