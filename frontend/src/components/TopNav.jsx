import { useContext, useEffect, useState } from 'react';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const TopNav = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useContext(AuthContext);

  return (
    <header className="topnav glass-panel">
      <div className="topnav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!sidebarOpen && (
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        )}
        

      </div>
      <div className="topnav-right">
        <button className="action-btn">
          <Bell size={20} />
        </button>
        <button className="action-btn avatar-btn">
          <UserIcon size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopNav;
