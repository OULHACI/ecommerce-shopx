# ⚡ ShopX — Full-Stack E-Commerce Application

A complete, production-grade e-commerce web application built with **React (Vite)** + **Python Flask** + **SQLite**.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend starts at **http://localhost:5000**

> Database is auto-created and seeded with sample data on first run.

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

---

## 🔐 Demo Accounts

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Admin  | admin@shop.com     | admin123   |
| Seller | seller@shop.com    | seller123  |
| Client | client@shop.com    | client123  |

> You can also use the **Quick Login** buttons on the login page.

---

## 👥 Role Features

### 🔴 Admin
- Analytics dashboard (users, revenue, orders, top products, low stock)
- Approve / reject seller products
- Delete any product
- Manage all users (change role, block/unblock)
- Manage all orders (update status)
- Send system notifications to users or all users

### 🟡 Seller
- Add products (sent for admin approval)
- Edit / delete own products
- Set discount percentage
- View orders containing their products
- Sales dashboard with stats

### 🟢 Client
- Browse & search products with category filter
- View product details with discounted prices
- Add to cart, adjust quantities
- Wishlist / favorites
- Checkout with address, delivery type, payment method
- Fake card payment form (demo only)
- View order history & confirm delivery
- In-app notifications

---

## 🏗️ Architecture

```
backend/
  app.py                  ← Flask entry point
  database.py             ← DB init + seeding
  database.db             ← SQLite (auto-created)
  requirements.txt
  routes/
    auth_routes.py
    product_routes.py
    order_routes.py
    user_routes.py
    notification_routes.py
    admin_routes.py
  services/
    services.py           ← Business logic
  repositories/
    repositories.py       ← SQL queries
  controllers/            ← (Thin layer, logic in services)

frontend/
  src/
    App.jsx               ← Router + providers
    main.jsx
    index.css             ← Global design system
    context/
      AuthContext.jsx     ← User session
      CartContext.jsx     ← Shopping cart state
    services/
      api.js              ← All API calls
    components/
      Navbar.jsx
      ProductCard.jsx
    pages/
      Login.jsx
      Register.jsx
      Home.jsx            ← Product listing + search
      ProductDetail.jsx
      Cart.jsx
      Checkout.jsx        ← Delivery + fake payment
      Orders.jsx
      Favorites.jsx
      Notifications.jsx
      AdminDashboard.jsx
      SellerDashboard.jsx
```

---

## 🗄️ Database Tables

- `users` — id, name, email, password, role, status
- `products` — id, name, price, description, category, image, stock, seller_id, discount_percentage, status
- `orders` — id, user_id, total, address, city, phone, payment_method, delivery_type, status
- `order_items` — id, order_id, product_id, quantity, price
- `favorites` — id, user_id, product_id
- `notifications` — id, user_id, message, status, created_at

---

## ✨ Key Features

- **Discount system**: original vs. final price shown everywhere
- **Stock management**: auto-decremented on order
- **Delivery types**: Standard (free, 3-5 days) or Express ($15, 24h)
- **Fake payment**: cash on delivery or card form (demo)
- **Real-time notifications**: order updates, product approval, delivery
- **Role-based routing**: protected pages per role
- **Admin analytics**: charts of top products, revenue, low stock alerts
