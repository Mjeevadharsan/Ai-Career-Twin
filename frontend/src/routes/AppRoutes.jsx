import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Home             from '../pages/Home'
import Login            from '../pages/Login'
import Signup           from '../pages/Signup'
import Dashboard        from '../pages/Dashboard'
import Profile          from '../pages/Profile'
import CareerPrediction from '../pages/CareerPrediction'
import SkillGapAnalysis from '../pages/SkillGapAnalysis'
import Recommendations  from '../pages/Recommendations'
import Settings         from '../pages/Settings'
import AdminLogin       from '../pages/AdminLogin'
import AdminDashboard   from '../pages/AdminDashboard'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><i className="fa-solid fa-spinner fa-spin" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><i className="fa-solid fa-spinner fa-spin" /></div>
  return user && user.role === 'ADMIN' ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"       element={<Home />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin Login */}
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Student */}
      <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/prediction"     element={<PrivateRoute><CareerPrediction /></PrivateRoute>} />
      <Route path="/skill-gap"      element={<PrivateRoute><SkillGapAnalysis /></PrivateRoute>} />
      <Route path="/recommendations"element={<PrivateRoute><Recommendations /></PrivateRoute>} />
      <Route path="/settings"       element={<PrivateRoute><Settings /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
