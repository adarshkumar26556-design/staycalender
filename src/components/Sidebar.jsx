import { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Calendar as CalendarIcon, IndianRupee, Settings, LogOut, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = user?.role === 'Admin' ? [
    { name: 'Admin Panel', path: '/admin', icon: <Settings size={20} /> }
  ] : [
    { name: 'Calendar', path: '/', icon: <CalendarIcon size={20} /> },
    { name: 'Room Status', path: '/status', icon: <LayoutDashboard size={20} /> },
    { name: 'Revenue', path: '/revenue', icon: <IndianRupee size={20} /> },
  ];

  return (
    <aside className={`sidebar glass-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Building2 color="var(--accent-primary)" />
          {isOpen && <span>StayCalendar</span>}
        </div>
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            title={!isOpen ? item.name : ''}
            onClick={() => { if (window.innerWidth <= 768) setIsOpen(false); }}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-label">{item.name}</span>}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          {isOpen && (
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
