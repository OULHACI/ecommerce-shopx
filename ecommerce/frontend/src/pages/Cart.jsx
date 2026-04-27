import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="page">
      <div className="empty-state">
        <div className="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Start shopping to add items</p>
        <Link to="/" className="btn btn-primary" style={{marginTop:'16px'}}>Browse Products</Link>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="cart-header">
        <h1 className="page-title">Shopping Cart</h1>
        <button className="btn btn-outline btn-sm" onClick={clearCart}>Clear All</button>
      </div>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.product_id} className="cart-item card">
              <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <span className="cart-item-price">${item.price.toFixed(2)} each</span>
              </div>
              <div className="qty-control">
                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, Math.min(item.stock, item.quantity + 1))}>+</button>
              </div>
              <div className="cart-item-total">${(item.price * item.quantity).toFixed(2)}</div>
              <button className="remove-btn" onClick={() => removeFromCart(item.product_id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="cart-summary card">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Items ({cart.reduce((s,i)=>s+i.quantity,0)})</span><span>${total.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span className="free">FREE</span></div>
          <div className="summary-total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="btn btn-primary" style={{width:'100%',marginTop:'20px'}} onClick={() => navigate('/checkout')}>
            Proceed to Checkout →
          </button>
          <Link to="/" className="btn btn-outline" style={{width:'100%',marginTop:'10px',justifyContent:'center'}}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
