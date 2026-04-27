import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'client',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            category TEXT,
            image TEXT,
            stock INTEGER DEFAULT 0,
            seller_id INTEGER,
            discount_percentage REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            address TEXT,
            city TEXT,
            phone TEXT,
            payment_method TEXT DEFAULT 'cash',
            delivery_type TEXT DEFAULT 'standard',
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            UNIQUE(user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_data():
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] > 0:
        conn.close()
        return

    # Seed users
    users = [
        ('Admin User', 'admin@shop.com', hash_password('admin123'), 'admin', 'active'),
        ('John Seller', 'seller@shop.com', hash_password('seller123'), 'seller', 'active'),
        ('Jane Client', 'client@shop.com', hash_password('client123'), 'client', 'active'),
        ('Tech Store', 'tech@shop.com', hash_password('seller123'), 'seller', 'active'),
        ('Alice Brown', 'alice@shop.com', hash_password('client123'), 'client', 'active'),
    ]
    c.executemany("INSERT INTO users (name,email,password,role,status) VALUES (?,?,?,?,?)", users)
    conn.commit()

    c.execute("SELECT id FROM users WHERE role='seller' LIMIT 1")
    seller1 = c.fetchone()[0]
    c.execute("SELECT id FROM users WHERE role='seller' LIMIT 1 OFFSET 1")
    seller2_row = c.fetchone()
    seller2 = seller2_row[0] if seller2_row else seller1

    products = [
        ('iPhone 15 Pro', 999.99, 'Latest Apple iPhone with A17 chip', 'Electronics', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 50, seller1, 5, 'approved'),
        ('Samsung Galaxy S24', 849.99, 'Samsung flagship smartphone', 'Electronics', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 30, seller1, 10, 'approved'),
        ('Nike Air Max', 129.99, 'Comfortable running shoes', 'Shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 100, seller1, 15, 'approved'),
        ('Leather Jacket', 199.99, 'Premium genuine leather jacket', 'Clothing', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 20, seller1, 0, 'approved'),
        ('MacBook Pro 14"', 1999.99, 'Apple M3 Pro chip laptop', 'Electronics', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 15, seller2, 8, 'approved'),
        ('Sony WH-1000XM5', 349.99, 'Premium noise cancelling headphones', 'Electronics', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', 40, seller2, 20, 'approved'),
        ('Adidas Ultraboost', 159.99, 'High performance running shoes', 'Shoes', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', 60, seller2, 0, 'approved'),
        ('Winter Coat', 249.99, 'Warm and stylish winter coat', 'Clothing', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', 25, seller1, 25, 'approved'),
        ('iPad Pro 12.9"', 1099.99, 'Apple iPad Pro with M2 chip', 'Electronics', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 8, seller2, 0, 'approved'),
        ('Running Shorts', 49.99, 'Lightweight athletic shorts', 'Clothing', 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400', 200, seller1, 30, 'approved'),
        ('Coffee Maker', 79.99, 'Drip coffee maker 12 cup', 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 35, seller2, 0, 'approved'),
        ('Yoga Mat', 39.99, 'Non-slip premium yoga mat', 'Sports', 'https://images.unsplash.com/photo-1601925228046-4f4aed1d81df?w=400', 5, seller1, 10, 'approved'),
    ]
    c.executemany("INSERT INTO products (name,price,description,category,image,stock,seller_id,discount_percentage,status) VALUES (?,?,?,?,?,?,?,?,?)", products)
    conn.commit()

    c.execute("SELECT id FROM users WHERE role='client' LIMIT 1")
    client = c.fetchone()[0]

    c.execute("INSERT INTO orders (user_id,total,address,city,phone,payment_method,delivery_type,status) VALUES (?,?,?,?,?,?,?,?)",
              (client, 1129.98, '123 Main St', 'New York', '555-1234', 'card', 'express', 'delivered'))
    order_id = c.lastrowid

    c.execute("SELECT id FROM products LIMIT 2")
    prods = c.fetchall()
    c.execute("INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)", (order_id, prods[0][0], 1, 999.99))
    c.execute("INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)", (order_id, prods[1][0], 1, 129.99))

    c.execute("INSERT INTO notifications (user_id,message,status) VALUES (?,?,?)",
              (client, 'Your order has been delivered!', 'unread'))
    conn.commit()
    conn.close()
    print("✅ Database seeded successfully!")
