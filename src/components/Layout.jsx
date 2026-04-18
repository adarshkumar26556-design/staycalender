import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

const Layout = ({ children }) => {
  // Start closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const { user } = useContext(AuthContext);

  const themeClass = user?.role === 'Admin' ? 'theme-admin' : 'theme-user';
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    document.body.className = themeClass;
  }, [themeClass]);

  // Close sidebar on resize to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`app-container ${themeClass}`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {/* Dark overlay — tap to close sidebar on mobile */}
      {sidebarOpen && isMobile && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <TopNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
