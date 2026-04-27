import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './AdminDashboard.css';

const statusColors = { pending: 'warning', paid: 'info', shipped: 'info', delivered: 'success' };

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState({});
  const [tab, setTab] = useState('overview');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifSent, setNotifSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [aData, uData, oData, pData] = await Promise.all([
        api.getAnalytics(), api.getUsers(), api.getAllOrders(),
        api.getProducts({ all: 'true' })
      ]);
      setAnalytics(aData);
      setUsers(uData.users);
      setOrders(oData.orders);
      setProducts(pData.products);
      setDiscounts(Object.fromEntries(pData.products.map(p => [p.id, p.discount_percentage || 0])));
    } finally { setLoading(false); }
  }

  const updateOrderStatus = async (id, status) => {
    await api.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateUserRole = async (id, role) => {
    await api.updateUserRole(id, role);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const toggleUser = async (id) => {
    await api.toggleUserStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u));
  };

  const approveProduct = async (id) => {
    await api.approveProduct(id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
  };

  const updateProductDiscount = async (id) => {
    const value = Number(discounts[id] || 0);
    await api.updateProduct(id, { discount_percentage: value });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, discount_percentage: value } : p));
  };

  const handleDiscountChange = (id, value) => {
    setDiscounts(prev => ({ ...prev, [id]: value }));
  };
  const rejectProduct = async (id) => {
    await api.rejectProduct(id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
  };
  const deleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const sendNotification = async () => {
    await api.sendNotification(notifTarget, notifMsg);
    setNotifSent(true); setNotifMsg('');
    setTimeout(() => setNotifSent(false), 3000);
  };

  if (loading) return <div className="loading">Chargement du tableau de bord...</div>;

  const tabs = ['overview', 'products', 'orders', 'users', 'notifications'];
  const tabLabels = {
    overview: 'Aperçu',
    products: 'Produits',
    orders: 'Commandes',
    users: 'Utilisateurs',
    notifications: 'Notifications',
  };

  return (
    <div className="page admin-page">
      <h1 className="page-title">⚡ Tableau de bord administrateur</h1>
      <div className="admin-tabs">
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div>
          <div className="stats-grid">
            {[
              { label: 'Utilisateurs', value: analytics.total_users, icon: '👥' },
              { label: 'Vendeurs', value: analytics.total_sellers, icon: '🏪' },
              { label: 'Produits', value: analytics.total_products, icon: '📦' },
              { label: 'Commandes', value: analytics.total_orders, icon: '🛒' },
              { label: 'Chiffre d\'affaires', value: `$${analytics.total_revenue?.toFixed(2)}`, icon: '💰' },
              { label: 'Clients', value: analytics.total_clients, icon: '👤' },
            ].map(s => (
              <div key={s.label} className="stat-card card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="analytics-grid">
            <div className="card analytics-card">
              <h3>🏆 Top 5 produits vendus</h3>
              {analytics.top_products?.length === 0 ? <p style={{color:'var(--text2)'}}>Aucune donnée</p> : analytics.top_products?.map((p, i) => (
                <div key={p.id} className="top-product">
                  <span className="rank">#{i+1}</span>
                  <img src={p.image} alt={p.name} />
                  <div>
                    <p>{p.name}</p>
                    <span>{p.total_sold} vendus • ${p.revenue?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card analytics-card">
              <h3>⚠️ Suivi produits faibles en stock</h3>
              {analytics.low_stock?.length === 0 ? <p style={{color:'var(--success)'}}>Tous les produits sont bien approvisionnés.</p> : analytics.low_stock?.map(p => (
                <div key={p.id} className="low-stock-item">
                  <img src={p.image} alt={p.name} />
                  <div><p>{p.name}</p><span style={{color: p.stock===0?'var(--danger)':'var(--warning)'}}>{p.stock === 0 ? 'Rupture de stock' : `Il reste ${p.stock}`}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="analytics-grid">
            <div className="card analytics-card">
              <h3>⭐ Top vendeurs</h3>
              {analytics.top_sellers?.length === 0 ? <p style={{color:'var(--text2)'}}>Aucune donnée</p> : analytics.top_sellers?.map((s, i) => (
                <div key={s.id} className="top-product">
                  <span className="rank">#{i+1}</span>
                  <div>
                    <p>{s.name}</p>
                    <span>{s.total_sold} articles vendus • ${s.revenue?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card analytics-card">
              <h3>📦 Statut des commandes</h3>
              {analytics.order_statuses?.length === 0 ? <p style={{color:'var(--text2)'}}>Aucune donnée</p> : (
                <div>
                  {analytics.order_statuses.map(s => (
                    <div key={s.status} style={{display:'flex',justifyContent:'space-between',margin:'10px 0'}}>
                      <span>{s.status.charAt(0).toUpperCase()+s.status.slice(1)}</span>
                      <strong>{s.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="card analytics-card revenue-chart-card">
            <h3>📈 Tendances des ventes annuelles</h3>
            <div className="chart-grid">
              {analytics.monthly_sales?.map((m, index) => {
                const max = Math.max(...analytics.monthly_sales.map(item => item.revenue), 1);
                const height = Math.round((m.revenue / max) * 100);
                return (
                  <div key={m.month} className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ height: `${height}px` }} />
                    <span>{m.month}</span>
                    <small>${m.revenue?.toFixed(0)}</small>
                  </div>
                );
              })}
            </div>
            <div className="chart-summary">
              <div><strong>{analytics.total_revenue?.toFixed(2)}</strong> revenu total</div>
              <div><strong>{analytics.total_orders}</strong> commandes terminées</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Produit</th><th>Prix</th><th>Remise</th><th>Stock</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><div style={{display:'flex',gap:'10px',alignItems:'center'}}><img src={p.image} alt={p.name} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}} />{p.name}</div></td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td style={{minWidth: '150px'}}>
                      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discounts[p.id] ?? 0}
                          onChange={e => handleDiscountChange(p.id, e.target.value)}
                          style={{width:'70px', padding:'8px 10px'}}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => updateProductDiscount(p.id)}>Appliquer</button>
                      </div>
                    </td>
                    <td><span style={{color:p.stock<=5?'var(--danger)':p.stock<=10?'var(--warning)':'var(--text)'}}>{p.stock}</span></td>
                    <td><span className={`badge badge-${p.status==='approved'?'success':p.status==='rejected'?'danger':'warning'}`}>{p.status}</span></td>
                    <td>
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        {p.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => approveProduct(p.id)}>Approuver</button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejectProduct(p.id)}>Rejeter</button>
                        </>}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Client</th><th>Total</th><th>Paiement</th><th>Statut</th><th>Mettre à jour</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.user_name}</td>
                    <td>${o.total?.toFixed(2)}</td>
                    <td>{o.payment_method}</td>
                    <td><span className={`badge badge-${statusColors[o.status]||'gray'}`}>{o.status === 'delivered' ? 'Livré' : o.status === 'shipped' ? 'Expédié' : o.status === 'paid' ? 'Payé' : 'En attente'}</span></td>
                    <td>
                      <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} style={{width:'auto',padding:'6px 10px'}}>
                        {['pending','paid','shipped','delivered'].map(s => <option key={s} value={s}>{s === 'pending' ? 'En attente' : s === 'paid' ? 'Payé' : s === 'shipped' ? 'Expédié' : 'Livré'}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td style={{color:'var(--text2)'}}>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} style={{width:'auto',padding:'6px 10px'}}>
                        {['client','seller','admin'].map(r => <option key={r} value={r}>{r === 'client' ? 'Client' : r === 'seller' ? 'Vendeur' : 'Admin'}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge badge-${u.status==='active'?'success':'danger'}`}>{u.status === 'active' ? 'Actif' : 'Bloqué'}</span></td>
                    <td>
                      <button className={`btn btn-sm ${u.status==='active'?'btn-danger':'btn-success'}`} onClick={() => toggleUser(u.id)}>
                        {u.status === 'active' ? 'Bloquer' : 'Débloquer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card" style={{padding:'28px',maxWidth:'600px'}}>
          <h3 style={{marginBottom:'20px',fontSize:'18px',fontWeight:'700'}}>📢 Envoyer une notification</h3>
          <div className="form-group" style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--text2)',marginBottom:'6px',textTransform:'uppercase'}}>Cible</label>
            <select value={notifTarget} onChange={e => setNotifTarget(e.target.value)}>
              <option value="all">Tous les utilisateurs</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role === 'client' ? 'Client' : u.role === 'seller' ? 'Vendeur' : 'Admin'})</option>)}
            </select>
          </div>
          <div className="form-group" style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--text2)',marginBottom:'6px',textTransform:'uppercase'}}>Message</label>
            <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Tapez votre message..." rows={4} style={{resize:'vertical'}} />
          </div>
          {notifSent && <p className="success-msg">✓ Notification envoyée !</p>}
          <button className="btn btn-primary" onClick={sendNotification} disabled={!notifMsg}>Envoyer</button>
        </div>
      )}
    </div>
  );
}
