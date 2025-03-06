import { Link } from 'react-router-dom'
 
const NavBar = () => {
  return (
    <header>
      <div className="navBar-container">
        <Link to="/">
          <h1>Roo Fitness</h1>
        </Link>
        <nav>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default NavBar;