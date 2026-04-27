from flask import Blueprint, request, jsonify
from services.services import ProductService, FavoriteService

product_bp = Blueprint('products', __name__)
product_service = ProductService()
favorite_service = FavoriteService()

def get_user():
    user_id = request.headers.get('X-User-Id')
    user_role = request.headers.get('X-User-Role')
    if not user_id:
        return None
    return {'id': int(user_id), 'role': user_role}

@product_bp.route('/', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search')
    user = get_user()
    seller_id = None
    include_pending = False
    if user and user['role'] == 'seller':
        seller_id = request.args.get('seller_id')
        if seller_id:
            seller_id = int(seller_id)
            include_pending = True
    elif user and user['role'] == 'admin':
        include_pending = request.args.get('all') == 'true'
    products = product_service.get_products(category=category, search=search, seller_id=seller_id, include_pending=include_pending)
    return jsonify({'products': products})

@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    p = product_service.get_product(product_id)
    if not p:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'product': p})

@product_bp.route('/', methods=['POST'])
def create_product():
    user = get_user()
    if not user or user['role'] not in ['seller', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    p = product_service.create_product(data, user['id'])
    return jsonify({'product': p}), 201

@product_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    ok, err = product_service.update_product(product_id, request.json, user)
    if not ok:
        return jsonify({'error': err}), 400
    return jsonify({'success': True})

@product_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    ok, err = product_service.delete_product(product_id, user)
    if not ok:
        return jsonify({'error': err}), 400
    return jsonify({'success': True})

@product_bp.route('/<int:product_id>/approve', methods=['POST'])
def approve_product(product_id):
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    product_service.approve_product(product_id)
    return jsonify({'success': True})

@product_bp.route('/<int:product_id>/reject', methods=['POST'])
def reject_product(product_id):
    user = get_user()
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    product_service.reject_product(product_id)
    return jsonify({'success': True})

@product_bp.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({'categories': product_service.get_categories()})

@product_bp.route('/favorites', methods=['GET'])
def get_favorites():
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'favorites': favorite_service.get_favorites(user['id'])})

@product_bp.route('/<int:product_id>/favorite', methods=['POST'])
def toggle_favorite(product_id):
    user = get_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 403
    is_fav = favorite_service.toggle(user['id'], product_id)
    return jsonify({'favorited': is_fav})
