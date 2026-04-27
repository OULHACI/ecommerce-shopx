import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Checkout.css';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    address: '', city: '', phone: '',
    payment_method: 'cash', delivery_type: 'standard',
    card_number: '', card_expiry: '', card_cvv: ''
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address || !form.city || !form.phone) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try {
      await api.placeOrder({
        cart: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        address: form.address, city: form.city, phone: form.phone,
        payment_method: form.payment_method, delivery_type: form.delivery_type
      });
      clearCart();
      navigate('/orders', { state: { success: true } });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (cart.length === 0) { navigate('/cart'); return null; }

  const deliveryCost = form.delivery_type === 'express' ? 15 : 0;

  return (
    <div className="page">
      <h1 className="page-title">Checkout</h1>
      <form onSubmit={handleSubmit} className="checkout-layout">
        <div className="checkout-form">
          <div className="checkout-section card">
            <h3>📍 Delivery Address</h3>
            <div className="form-group">
              <label>Street Address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="New York" required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555-1234" required />
              </div>
            </div>
            <div className="form-group">
              <label>Delivery Type</label>
              <div className="delivery-options">
                <label className={`delivery-option ${form.delivery_type === 'standard' ? 'active' : ''}`}>
                  <input type="radio" name="delivery" value="standard" checked={form.delivery_type === 'standard'} onChange={() => set('delivery_type', 'standard')} />
                  <div>
                    <strong>📦 Standard</strong>
                    <span>3-5 business days • FREE</span>
                  </div>
                </label>
                <label className={`delivery-option ${form.delivery_type === 'express' ? 'active' : ''}`}>
                  <input type="radio" name="delivery" value="express" checked={form.delivery_type === 'express'} onChange={() => set('delivery_type', 'express')} />
                  <div>
                    <strong>⚡ Express</strong>
                    <span>24 hours • $15.00</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="checkout-section card">
            <h3>💳 Payment</h3>
            <div className="payment-options">
              <label className={`pay-option ${form.payment_method === 'cash' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="cash" checked={form.payment_method === 'cash'} onChange={() => set('payment_method', 'cash')} />
                <strong>💵 Cash on Delivery</strong>
              </label>
              <label className={`pay-option ${form.payment_method === 'card' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="card" checked={form.payment_method === 'card'} onChange={() => set('payment_method', 'card')} />
                <strong>💳 Credit/Debit Card</strong>
              </label>
            </div>
            {form.payment_method === 'card' && (
              <div className="card-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input value={form.card_number} onChange={e => set('card_number', e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry</label>
                    <input value={form.card_expiry} onChange={e => set('card_expiry', e.target.value)} placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input value={form.card_cvv} onChange={e => set('card_cvv', e.target.value)} placeholder="123" maxLength={3} type="password" />
                  </div>
                </div>
                <div className="fake-payment-notice">🔒 This is a demo — no real payment is processed</div>
              </div>
            )}
          </div>
        </div>

        <div className="checkout-summary card">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map(i => (
              <div key={i.product_id} className="summary-item">
                <img src={i.image} alt={i.name} />
                <div>
                  <p>{i.name}</p>
                  <span>x{i.quantity}</span>
                </div>
                <strong>${(i.price * i.quantity).toFixed(2)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{deliveryCost > 0 ? `$${deliveryCost}` : 'FREE'}</span></div>
          <div className="summary-total"><span>Total</span><span>${(total + deliveryCost).toFixed(2)}</span></div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{width:'100%',marginTop:'16px'}} disabled={loading}>
            {loading ? 'Placing order...' : '✓ Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
