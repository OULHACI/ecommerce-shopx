import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import './Orders.css';

const statusColors = { pending: 'warning', paid: 'info', shipped: 'info', delivered: 'success' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    api.getMyOrders().then(d => { setOrders(d.orders); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const confirmDelivery = async (id) => {
    await api.confirmDelivery(id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'delivered' } : o));
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="page">
      {location.state?.success && (
        <div className="success-banner">🎉 Your order was placed successfully! Thank you for shopping with us.</div>
      )}
      <h1 className="page-title">My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="icon">📦</div><h3>No orders yet</h3><p>Place your first order!</p></div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="order-meta">
                  <span className={`badge badge-${statusColors[order.status] || 'gray'}`}>{order.status}</span>
                  <span className="order-total">${order.total?.toFixed(2)}</span>
                </div>
              </div>
              <div className="order-details">
                <div className="order-info-row">
                  <span>📍 {order.address}, {order.city}</span>
                  <span>📞 {order.phone}</span>
                  <span>💳 {order.payment_method}</span>
                  <span>🚚 {order.delivery_type}</span>
                </div>
                <div className="order-items">
                  {order.items?.map(item => (
                    <div key={item.id} className="order-item">
                      <img src={item.image} alt={item.product_name} />
                      <span>{item.product_name}</span>
                      <span>x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {order.status === 'shipped' && (
                  <button className="btn btn-success btn-sm" onClick={() => confirmDelivery(order.id)}>
                    ✓ Confirm Delivery
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
