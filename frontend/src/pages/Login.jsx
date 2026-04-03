import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, Mail, Lock, Loader2 } from 'lucide-react';
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

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-container">
            <Building2 size={36} color="var(--accent-primary)" />
          </div>
          <h1>StayCalendar</h1>
          <p>Login to manage your properties</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@staycalendar.com"
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? <Loader2 className="spinner" size={20} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
