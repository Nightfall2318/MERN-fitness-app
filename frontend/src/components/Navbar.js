// components/Navbar.js
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/Navbar.css';

const NavBar = () => {
  const location = useLocation();
  
  // Helper function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active-link' : '';
  };
  
  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="logo-link">
          <h1 className="site-title">Roo Fitness</h1>
        </Link>
        
        <nav className="main-nav">
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Home
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;