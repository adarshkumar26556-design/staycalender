import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useContext(AuthContext);

  const themeClass = user?.role === 'Admin' ? 'theme-admin' : 'theme-user';

  useEffect(() => {
    document.body.className = themeClass;
  }, [themeClass]);

  return (
    <div className={`app-container ${themeClass}`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
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
