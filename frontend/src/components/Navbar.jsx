import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const authPages = ['/login', '/signup', '/admin/dashboard']
  
  if (authPages.some(path => location.pathname.startsWith(path))) return null

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isAdmin = user && user.role === 'ADMIN'

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <img src={logo} alt="AI Career Twin" className="brand-logo-img" />
          </div>
          <span className="brand-name">AI Career <span>Twin</span></span>
        </Link>

        {user && (
          <nav className="nav-links">
            {isAdmin ? (
              <NavLink to="/admin/dashboard" icon="fa-shield-halved" label="Admin Panel" />
            ) : (
              <>
                <NavLink to="/dashboard"     icon="fa-gauge"          label="Dashboard" />
                <NavLink to="/prediction"    icon="fa-microchip"      label="Career Prediction" />
                <NavLink to="/skill-gap"     icon="fa-road"           label="Skill Gap" />
                <NavLink to="/recommendations" icon="fa-graduation-cap" label="Recommendations" />
              </>
            )}
          </nav>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              <Link to={isAdmin ? "/admin/dashboard" : "/profile"} className="user-badge">
                <i className={`fa-solid ${isAdmin ? 'fa-user-shield' : 'fa-user-astronaut'}`} />
                <span>{user.fullName || user.username}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                <i className="fa-solid fa-arrow-right-from-bracket" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, icon, label }) {
  const { pathname } = useLocation()
  return (
    <Link to={to} className={`nav-link ${pathname === to ? 'active' : ''}`}>
      <i className={`fa-solid ${icon}`} /> {label}
    </Link>
  )
}
