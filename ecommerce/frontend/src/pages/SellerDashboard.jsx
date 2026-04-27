import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', category: '', image: '', stock: '', discount_percentage: 0 });
  const [formError, setFormError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [pData, oData] = await Promise.all([
        api.getProducts({ seller_id: user.id }), api.getSellerOrders()
      ]);
      setProducts(pData.products); setOrders(oData.orders);
    } finally { setLoading(false); }
  }

  const resetForm = () => { setForm({ name: '', price: '', description: '', category: '', image: '', stock: '', discount_percentage: 0 }); setEditProduct(null); setShowForm(false); setFormError(''); };

  const openEdit = (p) => {
    setForm({ name: p.name, price: p.price, description: p.description, category: p.category, image: p.image, stock: p.stock, discount_percentage: p.discount_percentage || 0 });
    setEditProduct(p.id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editProduct) {
        await api.updateProduct(editProduct, { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) });
      } else {
        await api.createProduct({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) });
      }
      resetForm(); loadData();
    } catch (err) { setFormError(err.message); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id));
  };

  const totalSales = orders.reduce((s, o) => s + o.total, 0);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page seller-page">
      <h1 className="page-title">🏪 Tableau de bord vendeur</h1>
      <div className="seller-stats">
        {[
          { label: 'Produits', value: products.length, icon: '📦' },
          { label: 'Commandes', value: orders.length, icon: '🛒' },
          { label: 'Ventes totales', value: `$${totalSales.toFixed(2)}`, icon: '💰' },
        ].map(s => (
          <div key={s.label} className="seller-stat card">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Mes produits</button>
        <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Commandes</button>
      </div>

      {tab === 'products' && (
        <div>
          <div style={{marginBottom:'16px'}}>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Annuler' : '+ Ajouter un produit'}
            </button>
          </div>
          {showForm && (
            <div className="card product-form">
              <h3>{editProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group"><label>Nom</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div className="form-group"><label>Prix (€)</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                  <div className="form-group"><label>Catégorie</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required /></div>
                  <div className="form-group"><label>Stock</label><input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required /></div>
                  <div className="form-group"><label>Remise (%)</label><input type="number" min="0" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})} /></div>
                  <div className="form-group"><label>Image URL</label><input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." /></div>
                </div>
                <div className="form-group" style={{marginTop:'12px'}}><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
                {formError && <p className="error-msg">{formError}</p>}
                <div style={{marginTop:'16px',display:'flex',gap:'10px'}}>
                  <button type="submit" className="btn btn-primary">{editProduct ? 'Mettre à jour' : 'Soumettre pour approbation'}</button>
                  <button type="button" className="btn btn-outline" onClick={resetForm}>Annuler</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Produit</th><th>Prix</th><th>Remise</th><th>Stock</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><div style={{display:'flex',gap:'10px',alignItems:'center'}}><img src={p.image} alt={p.name} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}} />{p.name}</div></td>
                      <td>${p.price?.toFixed(2)}</td>
                      <td>{p.discount_percentage ? `${p.discount_percentage}%` : '—'}</td>
                      <td><span style={{color:p.stock<=5?'var(--danger)':'inherit'}}>{p.stock}</span></td>
                      <td><span className={`badge badge-${p.status==='approved'?'success':p.status==='rejected'?'danger':'warning'}`}>{p.status}</span></td>
                      <td>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID commande</th><th>Client</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.user_name}</td>
                    <td>${o.total?.toFixed(2)}</td>
                    <td><span className={`badge badge-${o.status==='delivered'?'success':o.status==='shipped'?'info':'warning'}`}>{o.status === 'delivered' ? 'Livré' : o.status === 'shipped' ? 'Expédié' : 'En cours'}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
