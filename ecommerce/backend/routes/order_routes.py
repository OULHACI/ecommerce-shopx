from flask import Blueprint, request, jsonify
from services.services import OrderService

order_bp = Blueprint('orders', __name__)
order_service = OrderService()

def get_user():
    user_id = request.headers.get('X-User-Id')
    user_role = request.headers.get('X-User-Role')
    if not user_id:
        return None
    return {'id': int(user_id), 'role': user_role}

@order_bp.route('/', methods=['POST'])
def place_order():
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    order, err = order_service.place_order(
        user['id'], data.get('cart', []),
        data.get('address'), data.get('city'), data.get('phone'),
        data.get('payment_method', 'cash'), data.get('delivery_type', 'standard')
    )
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'order': order}), 201

@order_bp.route('/my', methods=['GET'])
def my_orders():
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'orders': order_service.get_user_orders(user['id'])})

@order_bp.route('/all', methods=['GET'])
def all_orders():
    user = get_user()
    if not user or user['role'] not in ['admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'orders': order_service.get_all_orders()})

@order_bp.route('/seller', methods=['GET'])
def seller_orders():
    user = get_user()
    if not user or user['role'] != 'seller':
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'orders': order_service.get_seller_orders(user['id'])})

@order_bp.route('/<int:order_id>/status', methods=['PUT'])
def update_status(order_id):
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    status = request.json.get('status')
    ok, err = order_service.update_status(order_id, status)
    if not ok:
        return jsonify({'error': err}), 400
    return jsonify({'success': True})

@order_bp.route('/<int:order_id>/confirm', methods=['POST'])
def confirm_delivery(order_id):
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    ok, err = order_service.confirm_delivery(order_id, user['id'])
    if not ok:
        return jsonify({'error': err}), 400
    return jsonify({'success': True})
