import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

export default function ProductCard({ product, onFavorite, isFav }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const discount = product.discount_percentage || 0;

  return (
    <div className="product-card card">
      <Link to={`/product/${product.id}`}>
        <div className="product-img-wrap">
          <img src={product.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name} />
          {discount > 0 && <span className="discount-tag">-{discount}%</span>}
          {product.stock <= 5 && product.stock > 0 && <span className="low-stock-tag">Low Stock</span>}
          {product.stock === 0 && <span className="out-stock-tag">Out of Stock</span>}
        </div>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/product/${product.id}`}><h3 className="product-name">{product.name}</h3></Link>
        <div className="product-price">
          {discount > 0 ? (
            <>
              <span className="final-price">${product.final_price?.toFixed(2)}</span>
              <span className="original-price">${product.price?.toFixed(2)}</span>
            </>
          ) : (
            <span className="final-price">${product.price?.toFixed(2)}</span>
          )}
        </div>
        <div className="product-actions">
          {user?.role === 'client' && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
              </button>
              {onFavorite && (
                <button className={`fav-btn ${isFav ? 'active' : ''}`} onClick={() => onFavorite(product.id)}>
                  {isFav ? '❤️' : '🤍'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
