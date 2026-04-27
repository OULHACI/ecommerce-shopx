import hashlib
from repositories.repositories import (
    UserRepository, ProductRepository, OrderRepository,
    FavoriteRepository, NotificationRepository
)

user_repo = UserRepository()
product_repo = ProductRepository()
order_repo = OrderRepository()
favorite_repo = FavoriteRepository()
notification_repo = NotificationRepository()


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def safe_product(p):
    if not p:
        return None
    p = dict(p)
    discount = p.get('discount_percentage', 0) or 0
    price = p.get('price', 0)
    p['final_price'] = round(price - (price * discount / 100), 2)
    return p


class AuthService:
    def register(self, name, email, password, role='client'):
        if user_repo.find_by_email(email):
            return None, 'Email already exists'
        if role not in ['client', 'seller']:
            role = 'client'
        hashed = hash_password(password)
        user = user_repo.create(name, email, hashed, role)
        user.pop('password', None)
        return user, None

    def login(self, email, password):
        user = user_repo.find_by_email(email)
        if not user:
            return None, 'Invalid credentials'
        if user['password'] != hash_password(password):
            return None, 'Invalid credentials'
        if user['status'] == 'blocked':
            return None, 'Your account has been blocked'
        user.pop('password', None)
        return user, None


class ProductService:
    def get_products(self, category=None, search=None, seller_id=None, include_pending=False):
        status = None if include_pending else 'approved'
        products = product_repo.get_all(status=status, category=category, search=search, seller_id=seller_id)
        return [safe_product(p) for p in products]

    def get_product(self, product_id):
        return safe_product(product_repo.find_by_id(product_id))

    def create_product(self, data, seller_id):
        data['seller_id'] = seller_id
        return product_repo.create(data)

    def update_product(self, product_id, data, user):
        p = product_repo.find_by_id(product_id)
        if not p:
            return False, 'Product not found'
        if user['role'] != 'admin' and p['seller_id'] != user['id']:
            return False, 'Unauthorized'
        product_repo.update(product_id, data)
        return True, None

    def delete_product(self, product_id, user):
        p = product_repo.find_by_id(product_id)
        if not p:
            return False, 'Product not found'
        if user['role'] != 'admin' and p['seller_id'] != user['id']:
            return False, 'Unauthorized'
        product_repo.delete(product_id)
        return True, None

    def approve_product(self, product_id):
        p = product_repo.find_by_id(product_id)
        if not p:
            return False
        product_repo.update_status(product_id, 'approved')
        notification_repo.create(p['seller_id'], f'Your product "{p["name"]}" has been approved!')
        return True

    def reject_product(self, product_id):
        p = product_repo.find_by_id(product_id)
        if not p:
            return False
        product_repo.update_status(product_id, 'rejected')
        notification_repo.create(p['seller_id'], f'Your product "{p["name"]}" has been rejected.')
        return True

    def get_categories(self):
        from database import get_db
        conn = get_db()
        cats = conn.execute("SELECT DISTINCT category FROM products WHERE status='approved'").fetchall()
        conn.close()
        return [c[0] for c in cats if c[0]]


class OrderService:
    def place_order(self, user_id, cart, address, city, phone, payment_method, delivery_type):
        if not cart:
            return None, 'Cart is empty'
        total = 0
        for item in cart:
            p = product_repo.find_by_id(item['product_id'])
            if not p:
                return None, f'Product not found'
            if p['stock'] < item['quantity']:
                return None, f'Insufficient stock for {p["name"]}'
            discount = p.get('discount_percentage', 0) or 0
            final_price = p['price'] - (p['price'] * discount / 100)
            total += final_price * item['quantity']

        order_id = order_repo.create({
            'user_id': user_id, 'total': round(total, 2),
            'address': address, 'city': city, 'phone': phone,
            'payment_method': payment_method, 'delivery_type': delivery_type
        })

        for item in cart:
            p = product_repo.find_by_id(item['product_id'])
            discount = p.get('discount_percentage', 0) or 0
            final_price = p['price'] - (p['price'] * discount / 100)
            order_repo.add_item(order_id, item['product_id'], item['quantity'], round(final_price, 2))
            product_repo.update_stock(item['product_id'], item['quantity'])

        notification_repo.create(user_id, f'Your order #{order_id} has been placed successfully!')
        return order_repo.find_by_id(order_id), None

    def get_user_orders(self, user_id):
        return order_repo.get_by_user(user_id)

    def get_all_orders(self):
        return order_repo.get_all()

    def get_seller_orders(self, seller_id):
        return order_repo.get_by_seller(seller_id)

    def update_status(self, order_id, status, admin=False):
        order = order_repo.find_by_id(order_id)
        if not order:
            return False, 'Order not found'
        order_repo.update_status(order_id, status)
        msg_map = {
            'shipped': f'Your order #{order_id} has been shipped!',
            'delivered': f'Your order #{order_id} has been delivered!',
            'paid': f'Payment confirmed for order #{order_id}.'
        }
        if status in msg_map:
            notification_repo.create(order['user_id'], msg_map[status])
        return True, None

    def confirm_delivery(self, order_id, user_id):
        order = order_repo.find_by_id(order_id)
        if not order or order['user_id'] != user_id:
            return False, 'Unauthorized'
        order_repo.update_status(order_id, 'delivered')
        notification_repo.create(user_id, f'You confirmed delivery of order #{order_id}. Thank you!')
        return True, None


class UserService:
    def get_all(self):
        users = user_repo.get_all()
        for u in users:
            u.pop('password', None)
        return users

    def update_role(self, user_id, role):
        user_repo.update_role(user_id, role)

    def toggle_status(self, user_id):
        user = user_repo.find_by_id(user_id)
        if not user:
            return
        new_status = 'blocked' if user['status'] == 'active' else 'active'
        user_repo.update_status(user_id, new_status)


class AdminService:
    def get_analytics(self):
        return {
            'total_users': user_repo.count(),
            'total_sellers': user_repo.count_by_role('seller'),
            'total_clients': user_repo.count_by_role('client'),
            'total_products': product_repo.count(),
            'total_orders': order_repo.count(),
            'total_revenue': order_repo.total_revenue(),
            'monthly_sales': order_repo.monthly_revenue_by_month(),
            'top_products': product_repo.get_top_selling(5),
            'top_sellers': product_repo.get_top_sellers(5),
            'order_statuses': order_repo.count_by_status(),
            'low_stock': product_repo.get_low_stock(10),
        }

    def send_notification(self, user_id, message):
        if user_id == 'all':
            users = user_repo.get_all()
            for u in users:
                notification_repo.create(u['id'], message)
        else:
            notification_repo.create(int(user_id), message)


class FavoriteService:
    def toggle(self, user_id, product_id):
        if favorite_repo.is_favorite(user_id, product_id):
            favorite_repo.remove(user_id, product_id)
            return False
        else:
            favorite_repo.add(user_id, product_id)
            return True

    def get_favorites(self, user_id):
        return [safe_product(p) for p in favorite_repo.get_by_user(user_id)]


class NotificationService:
    def get_by_user(self, user_id):
        return notification_repo.get_by_user(user_id)

    def mark_read(self, notification_id, user_id):
        notification_repo.mark_read(notification_id, user_id)

    def mark_all_read(self, user_id):
        notification_repo.mark_all_read(user_id)

    def count_unread(self, user_id):
        return notification_repo.count_unread(user_id)
