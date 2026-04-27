import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadData();
    if (user?.role === 'client') loadFavorites();
  }, []);

  async function loadData() {
    try {
      const [pData, cData] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(pData.products);
      setCategories(cData.categories);
    } finally { setLoading(false); }
  }

  async function loadFavorites() {
    try {
      const data = await api.getFavorites();
      setFavorites(data.favorites.map(f => f.id));
    } catch {}
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const data = await api.getProducts(params);
      setProducts(data.products);
    } finally { setLoading(false); }
  }

  async function handleFavorite(productId) {
    try {
      const data = await api.toggleFavorite(productId);
      setFavorites(prev => data.favorited ? [...prev, productId] : prev.filter(id => id !== productId));
    } catch {}
  }

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-content">
          <h1>Discover Amazing<br /><span>Products</span></h1>
          <p>Shop the latest trends with unbeatable prices</p>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} className="cat-select">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="home-highlights page">
        <div className="highlight-card card">
          <h2>✨ عروض موسمية</h2>
          <p>اطّلع على أفضل التخفيضات ووفر حتى 30% على أفضل المنتجات الآن.</p>
        </div>
        <div className="highlight-card card">
          <h2>🚚 توصيل سريع</h2>
          <p>نوصّل طلبك بسرعة بأمان مع تتبع كامل حتى باب المنزل.</p>
        </div>
        <div className="highlight-card card">
          <h2>🛍️ تشكيلة مميزة</h2>
          <p>منتجات من أفضل البائعين مع تصميمات جديدة وتوافر مستمر.</p>
        </div>
      </div>

      <div className="page">
        {category && (
          <div className="filter-bar">
            <span>Showing: <strong>{category}</strong></span>
            <button onClick={() => { setCategory(''); setSearch(''); loadData(); }} className="btn btn-sm btn-outline">✕ Clear</button>
          </div>
        )}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No products found</h3>
            <p>Try different search terms</p>
          </div>
        ) : (
          <>
            <div className="results-count">{products.length} products found</div>
            <div className="grid-products">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onFavorite={user?.role === 'client' ? handleFavorite : null}
                  isFav={favorites.includes(p.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="home-info page">
        <div className="info-box">
          <h3>أفضل تجربة تسوق</h3>
          <p>واجهة أنيقة وسريعة مع تخفيضات واضحة، خيارات دفع آمنة، ودعم فوري للمشتريات.</p>
        </div>
        <div className="info-box">
          <h3>عروض يومية</h3>
          <p>اكتشف خصومات جديدة كل يوم وقم بحفظ المنتجات المفضلة لديك بسهولة.</p>
        </div>
        <div className="info-box">
          <h3>مظهر هادئ</h3>
          <p>حوّل الواجهة بين الوضع الفاتح والوضع الداكن واستمتع بتجربة مريحة للعين.</p>
        </div>
      </div>
    </div>
  );
}
