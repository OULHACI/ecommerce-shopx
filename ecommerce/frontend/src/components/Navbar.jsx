import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light';
    setTheme(stored);
    document.body.classList.toggle('light-theme', stored === 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.body.classList.toggle('light-theme', next === 'light');
  };

  useEffect(() => {
    if (user) {
      api.getNotifications().then(d => setUnread(d.unread_count)).catch(() => {});
      const interval = setInterval(() => {
        api.getNotifications().then(d => setUnread(d.unread_count)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">⚡ ShopX</Link>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user?.role === 'seller' && <Link to="/seller">Dashboard</Link>}
          {user && <Link to="/orders">Orders</Link>}
          {user?.role === 'client' && <Link to="/favorites">❤️ Wishlist</Link>}
        </div>
        <div className="navbar-actions">
          {user?.role === 'client' && (
            <Link to="/cart" className="cart-btn">
              🛒 Cart {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          )}
          {user && (
            <Link to="/notifications" className="notif-btn">
              🔔 {unread > 0 && <span className="notif-badge">{unread}</span>}
            </Link>
          )}
          <button className="btn btn-outline btn-sm theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.name}</span>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
