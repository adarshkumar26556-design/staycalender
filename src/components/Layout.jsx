import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

const Layout = ({ children }) => {
  // Start closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const { user } = useContext(AuthContext);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close sidebar on resize to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {/* Dark overlay — tap to close sidebar on mobile */}
      {sidebarOpen && isMobile && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <TopNav 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
