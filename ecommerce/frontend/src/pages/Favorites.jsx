import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites().then(d => { setFavorites(d.favorites); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleFavorite = async (productId) => {
    await api.toggleFavorite(productId);
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <h1 className="page-title">❤️ My Wishlist</h1>
      {favorites.length === 0 ? (
        <div className="empty-state"><div className="icon">❤️</div><h3>No favorites yet</h3><p>Heart products to save them here</p></div>
      ) : (
        <div className="grid-products">
          {favorites.map(p => <ProductCard key={p.id} product={p} onFavorite={handleFavorite} isFav={true} />)}
        </div>
      )}
    </div>
  );
}
