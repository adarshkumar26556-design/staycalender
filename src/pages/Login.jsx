import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, Mail, Lock, Loader2, BarChart3, Users, Globe, Zap } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
    setIsLoading(false);
  };

  const features = [
    { icon: <BarChart3 size={18} />, text: 'Real-time Revenue Insights' },
    { icon: <Users size={18} />, text: 'Guest CRM & WhatsApp' },
    { icon: <Globe size={18} />, text: 'OTA Channel Manager' },
    { icon: <Zap size={18} />, text: 'Smart AI Suggestions' },
  ];

  return (
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <Building2 size={32} />
            <span>StayCalendar</span>
          </div>
          <h1 className="brand-headline">
            The smarter way to<br />
            <span className="brand-highlight">run your hotel</span>
          </h1>
          <p className="brand-desc">
            All-in-one property management — bookings, guests, revenue tracking and OTA sync in one beautiful dashboard.
          </p>
          <ul className="brand-features">
            {features.map((f, i) => (
              <li key={i}>
                <span className="feature-icon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
          <div className="brand-footer">
            Built for Modern Hospitality
          </div>
        </div>
        {/* Decorative circles */}
        <div className="deco-circle deco-1" />
        <div className="deco-circle deco-2" />
        <div className="deco-circle deco-3" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-sm">
              <Building2 size={28} color="var(--accent-primary)" />
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to manage your property</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form" id="login-form">
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="hotel@staycalendar.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" id="login-submit" className="btn btn-primary login-btn" disabled={isLoading}>
              {isLoading ? <><Loader2 className="spinner" size={18} /> Signing in...</> : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
