import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.login(email, password);
      login(data.user);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'seller') navigate('/seller');
      else navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, pass) => {
    setEmail(email); setPassword(pass);
    setLoading(true); setError('');
    try {
      const data = await api.login(email, pass);
      login(data.user);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'seller') navigate('/seller');
      else navigate('/');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo">⚡</div>
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="quick-logins">
          <p>Quick login:</p>
          <div className="quick-btns">
            <button onClick={() => quickLogin('admin@shop.com','admin123')} className="btn btn-sm" style={{background:'rgba(239,68,68,0.2)',color:'#ef4444',border:'none'}}>Admin</button>
            <button onClick={() => quickLogin('seller@shop.com','seller123')} className="btn btn-sm" style={{background:'rgba(245,158,11,0.2)',color:'#f59e0b',border:'none'}}>Seller</button>
            <button onClick={() => quickLogin('client@shop.com','client123')} className="btn btn-sm" style={{background:'rgba(108,99,255,0.2)',color:'var(--accent)',border:'none'}}>Client</button>
          </div>
        </div>
        <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}
