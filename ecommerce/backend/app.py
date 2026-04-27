from flask import Flask
from flask_cors import CORS
from database import init_db, seed_data
from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.order_routes import order_bp
from routes.user_routes import user_bp
from routes.notification_routes import notification_bp
from routes.admin_routes import admin_bp

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'ecommerce_secret_key_2024'

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(order_bp, url_prefix='/api/orders')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

if __name__ == '__main__':
    init_db()
    seed_data()
    app.run(debug=True, port=5000)
