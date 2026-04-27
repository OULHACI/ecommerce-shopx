import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getProduct(id).then(d => { setProduct(d.product); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="page"><p>Product not found</p></div>;

  const discount = product.discount_percentage || 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="page product-detail-page">
      <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate(-1)}>← Back</button>
      <div className="product-detail-grid">
        <div className="product-detail-image">
          <img src={product.image || 'https://via.placeholder.com/500x400'} alt={product.name} />
          {discount > 0 && <div className="big-discount-tag">-{discount}% OFF</div>}
        </div>
        <div className="product-detail-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="seller-info">Sold by: <strong>{product.seller_name}</strong></div>
          <div className="detail-price">
            {discount > 0 ? (
              <>
                <span className="detail-final">${product.final_price?.toFixed(2)}</span>
                <span className="detail-original">${product.price?.toFixed(2)}</span>
                <span className="save-badge">Save ${(product.price - product.final_price).toFixed(2)}</span>
              </>
            ) : (
              <span className="detail-final">${product.price?.toFixed(2)}</span>
            )}
          </div>
          <p className="product-description">{product.description}</p>
          <div className="stock-info">
            {product.stock > 0 ? (
              <span className="in-stock">✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">✗ Out of Stock</span>
            )}
          </div>
          {user?.role === 'client' && product.stock > 0 && (
            <div className="add-to-cart-section">
              <div className="qty-control">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button className={`btn btn-primary ${added ? 'btn-success' : ''}`} onClick={handleAddToCart}>
                {added ? '✓ Added!' : '🛒 Add to Cart'}
              </button>
            </div>
          )}
          {!user && (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Login to Buy</button>
          )}
        </div>
      </div>
    </div>
  );
}
