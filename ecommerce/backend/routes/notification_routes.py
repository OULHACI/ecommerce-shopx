from flask import Blueprint, request, jsonify
from services.services import NotificationService

notification_bp = Blueprint('notifications', __name__)
notification_service = NotificationService()

def get_user():
    user_id = request.headers.get('X-User-Id')
    user_role = request.headers.get('X-User-Role')
    if not user_id:
        return None
    return {'id': int(user_id), 'role': user_role}

@notification_bp.route('/', methods=['GET'])
def get_notifications():
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    notifs = notification_service.get_by_user(user['id'])
    unread = notification_service.count_unread(user['id'])
    return jsonify({'notifications': notifs, 'unread_count': unread})

@notification_bp.route('/<int:notif_id>/read', methods=['PUT'])
def mark_read(notif_id):
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    notification_service.mark_read(notif_id, user['id'])
    return jsonify({'success': True})

@notification_bp.route('/read-all', methods=['PUT'])
def mark_all_read():
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    notification_service.mark_all_read(user['id'])
    return jsonify({'success': True})
