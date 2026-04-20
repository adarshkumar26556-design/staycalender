import { Menu, Bell, Sun, Moon, User as UserIcon } from 'lucide-react';

const TopNav = ({ sidebarOpen, setSidebarOpen, isDarkMode, setIsDarkMode }) => {

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
        <button className="action-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
