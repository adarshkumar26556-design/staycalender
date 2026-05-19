import { useContext, useEffect, useState } from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PAGE_NAMES = {
  '/': 'Dashboard',
  '/calendar': 'Booking Calendar',
  '/bookings': 'All Bookings',
  '/guests': 'Guest CRM',
  '/status': 'Room Status',
  '/revenue': 'Revenue Tracking',
  '/channel-manager': 'Channel Manager',
  '/admin': 'Admin Panel',
};

const TopNav = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const pageName = PAGE_NAMES[location.pathname] || 'StayCalendar';

  return (
    <header className="topnav">
      <div className="topnav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!sidebarOpen && (
          <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
        )}
        <div className="topnav-page-info">
          <h1 className="topnav-page-title">{pageName}</h1>
        </div>
      </div>

      <div className="topnav-right">
        <button
          className="action-btn"
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="action-btn" aria-label="Notifications" title="Notifications">
          <Bell size={20} />
        </button>
        <div className="topnav-user-pill" title={user?.name}>
          <div className="topnav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <span className="topnav-username">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
