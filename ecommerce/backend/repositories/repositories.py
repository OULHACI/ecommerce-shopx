from database import get_db

class UserRepository:
    def find_by_email(self, email):
        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        conn.close()
        return dict(user) if user else None

    def find_by_id(self, user_id):
        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        conn.close()
        return dict(user) if user else None

    def create(self, name, email, password, role='client'):
        conn = get_db()
        conn.execute("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", (name, email, password, role))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        conn.close()
        return dict(user)

    def get_all(self):
        conn = get_db()
        users = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
        conn.close()
        return [dict(u) for u in users]

    def update_role(self, user_id, role):
        conn = get_db()
        conn.execute("UPDATE users SET role=? WHERE id=?", (role, user_id))
        conn.commit()
        conn.close()

    def update_status(self, user_id, status):
        conn = get_db()
        conn.execute("UPDATE users SET status=? WHERE id=?", (status, user_id))
        conn.commit()
        conn.close()

    def count(self):
        conn = get_db()
        c = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        conn.close()
        return c

    def count_by_role(self, role):
        conn = get_db()
        c = conn.execute("SELECT COUNT(*) FROM users WHERE role=?", (role,)).fetchone()[0]
        conn.close()
        return c


class ProductRepository:
    def get_all(self, status=None, category=None, search=None, seller_id=None):
        conn = get_db()
        query = "SELECT p.*, u.name as seller_name FROM products p LEFT JOIN users u ON p.seller_id=u.id WHERE 1=1"
        params = []
        if status:
            query += " AND p.status=?"
            params.append(status)
        if category:
            query += " AND p.category=?"
            params.append(category)
        if search:
            query += " AND (p.name LIKE ? OR p.description LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%'])
        if seller_id:
            query += " AND p.seller_id=?"
            params.append(seller_id)
        query += " ORDER BY p.created_at DESC"
        products = conn.execute(query, params).fetchall()
        conn.close()
        return [dict(p) for p in products]

    def find_by_id(self, product_id):
        conn = get_db()
        p = conn.execute("SELECT p.*, u.name as seller_name FROM products p LEFT JOIN users u ON p.seller_id=u.id WHERE p.id=?", (product_id,)).fetchone()
        conn.close()
        return dict(p) if p else None

    def create(self, data):
        conn = get_db()
        conn.execute("INSERT INTO products (name,price,description,category,image,stock,seller_id,discount_percentage,status) VALUES (?,?,?,?,?,?,?,?,?)",
                     (data['name'], data['price'], data.get('description',''), data.get('category',''), data.get('image',''), data.get('stock',0), data['seller_id'], data.get('discount_percentage',0), 'pending'))
        conn.commit()
        p = conn.execute("SELECT * FROM products WHERE rowid=last_insert_rowid()").fetchone()
        conn.close()
        return dict(p)

    def update(self, product_id, data):
        conn = get_db()
        conn.execute("UPDATE products SET name=?,price=?,description=?,category=?,image=?,stock=?,discount_percentage=? WHERE id=?",
                     (data['name'], data['price'], data.get('description',''), data.get('category',''), data.get('image',''), data.get('stock',0), data.get('discount_percentage',0), product_id))
        conn.commit()
        conn.close()

    def update_status(self, product_id, status):
        conn = get_db()
        conn.execute("UPDATE products SET status=? WHERE id=?", (status, product_id))
        conn.commit()
        conn.close()

    def delete(self, product_id):
        conn = get_db()
        conn.execute("DELETE FROM products WHERE id=?", (product_id,))
        conn.commit()
        conn.close()

    def count(self):
        conn = get_db()
        c = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        conn.close()
        return c

    def get_top_selling(self, limit=5):
        conn = get_db()
        rows = conn.execute('''
            SELECT p.id, p.name, p.image, SUM(oi.quantity) as total_sold, SUM(oi.quantity*oi.price) as revenue
            FROM order_items oi JOIN products p ON oi.product_id=p.id
            GROUP BY p.id ORDER BY total_sold DESC LIMIT ?
        ''', (limit,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_top_sellers(self, limit=5):
        conn = get_db()
        rows = conn.execute('''
            SELECT u.id, u.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity*oi.price) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id=p.id
            JOIN users u ON p.seller_id=u.id
            GROUP BY u.id ORDER BY total_sold DESC LIMIT ?
        ''', (limit,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_low_stock(self, threshold=10):
        conn = get_db()
        rows = conn.execute("SELECT * FROM products WHERE stock<=? AND status='approved' ORDER BY stock ASC", (threshold,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def update_stock(self, product_id, quantity):
        conn = get_db()
        conn.execute("UPDATE products SET stock=stock-? WHERE id=?", (quantity, product_id))
        conn.commit()
        conn.close()


class OrderRepository:
    def create(self, data):
        conn = get_db()
        conn.execute("INSERT INTO orders (user_id,total,address,city,phone,payment_method,delivery_type,status) VALUES (?,?,?,?,?,?,?,?)",
                     (data['user_id'], data['total'], data.get('address',''), data.get('city',''), data.get('phone',''), data.get('payment_method','cash'), data.get('delivery_type','standard'), 'pending'))
        order_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.commit()
        conn.close()
        return order_id

    def add_item(self, order_id, product_id, quantity, price):
        conn = get_db()
        conn.execute("INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)", (order_id, product_id, quantity, price))
        conn.commit()
        conn.close()

    def find_by_id(self, order_id):
        conn = get_db()
        o = conn.execute("SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=?", (order_id,)).fetchone()
        if not o:
            conn.close()
            return None
        order = dict(o)
        items = conn.execute("SELECT oi.*, p.name as product_name, p.image FROM order_items oi JOIN products p ON oi.product_id=p.id WHERE oi.order_id=?", (order_id,)).fetchall()
        order['items'] = [dict(i) for i in items]
        conn.close()
        return order

    def get_by_user(self, user_id):
        conn = get_db()
        orders = conn.execute("SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
        result = []
        for o in orders:
            order = dict(o)
            items = conn.execute("SELECT oi.*, p.name as product_name, p.image FROM order_items oi JOIN products p ON oi.product_id=p.id WHERE oi.order_id=?", (o['id'],)).fetchall()
            order['items'] = [dict(i) for i in items]
            result.append(order)
        conn.close()
        return result

    def get_all(self):
        conn = get_db()
        orders = conn.execute("SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC").fetchall()
        conn.close()
        return [dict(o) for o in orders]

    def get_by_seller(self, seller_id):
        conn = get_db()
        orders = conn.execute('''
            SELECT DISTINCT o.*, u.name as user_name FROM orders o
            JOIN order_items oi ON o.id=oi.order_id
            JOIN products p ON oi.product_id=p.id
            JOIN users u ON o.user_id=u.id
            WHERE p.seller_id=? ORDER BY o.created_at DESC
        ''', (seller_id,)).fetchall()
        conn.close()
        return [dict(o) for o in orders]

    def update_status(self, order_id, status):
        conn = get_db()
        conn.execute("UPDATE orders SET status=? WHERE id=?", (status, order_id))
        conn.commit()
        conn.close()

    def count(self):
        conn = get_db()
        c = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
        conn.close()
        return c

    def total_revenue(self):
        conn = get_db()
        r = conn.execute("SELECT SUM(total) FROM orders WHERE status!='pending'").fetchone()[0]
        conn.close()
        return r or 0

    def count_by_status(self):
        conn = get_db()
        rows = conn.execute("SELECT status, COUNT(*) as count FROM orders GROUP BY status").fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def monthly_revenue_by_month(self):
        conn = get_db()
        rows = conn.execute('''
            SELECT strftime('%m', created_at) as month, SUM(total) as revenue, COUNT(*) as orders
            FROM orders
            WHERE status!='pending'
            GROUP BY month
            ORDER BY month
        ''').fetchall()
        conn.close()

        months = [
            {'month': 'Jan', 'revenue': 0, 'orders': 0},
            {'month': 'Feb', 'revenue': 0, 'orders': 0},
            {'month': 'Mar', 'revenue': 0, 'orders': 0},
            {'month': 'Apr', 'revenue': 0, 'orders': 0},
            {'month': 'May', 'revenue': 0, 'orders': 0},
            {'month': 'Jun', 'revenue': 0, 'orders': 0},
            {'month': 'Jul', 'revenue': 0, 'orders': 0},
            {'month': 'Aug', 'revenue': 0, 'orders': 0},
            {'month': 'Sep', 'revenue': 0, 'orders': 0},
            {'month': 'Oct', 'revenue': 0, 'orders': 0},
            {'month': 'Nov', 'revenue': 0, 'orders': 0},
            {'month': 'Dec', 'revenue': 0, 'orders': 0},
        ]
        for row in rows:
            index = int(row['month']) - 1
            months[index]['revenue'] = row['revenue'] or 0
            months[index]['orders'] = row['orders'] or 0
        return months


class FavoriteRepository:
    def add(self, user_id, product_id):
        conn = get_db()
        try:
            conn.execute("INSERT INTO favorites (user_id,product_id) VALUES (?,?)", (user_id, product_id))
            conn.commit()
        except:
            pass
        conn.close()

    def remove(self, user_id, product_id):
        conn = get_db()
        conn.execute("DELETE FROM favorites WHERE user_id=? AND product_id=?", (user_id, product_id))
        conn.commit()
        conn.close()

    def get_by_user(self, user_id):
        conn = get_db()
        rows = conn.execute("SELECT p.* FROM favorites f JOIN products p ON f.product_id=p.id WHERE f.user_id=?", (user_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def is_favorite(self, user_id, product_id):
        conn = get_db()
        r = conn.execute("SELECT id FROM favorites WHERE user_id=? AND product_id=?", (user_id, product_id)).fetchone()
        conn.close()
        return r is not None


class NotificationRepository:
    def create(self, user_id, message):
        conn = get_db()
        conn.execute("INSERT INTO notifications (user_id,message) VALUES (?,?)", (user_id, message))
        conn.commit()
        conn.close()

    def get_by_user(self, user_id):
        conn = get_db()
        rows = conn.execute("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def mark_read(self, notification_id, user_id):
        conn = get_db()
        conn.execute("UPDATE notifications SET status='read' WHERE id=? AND user_id=?", (notification_id, user_id))
        conn.commit()
        conn.close()

    def mark_all_read(self, user_id):
        conn = get_db()
        conn.execute("UPDATE notifications SET status='read' WHERE user_id=?", (user_id,))
        conn.commit()
        conn.close()

    def count_unread(self, user_id):
        conn = get_db()
        c = conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id=? AND status='unread'", (user_id,)).fetchone()[0]
        conn.close()
        return c
