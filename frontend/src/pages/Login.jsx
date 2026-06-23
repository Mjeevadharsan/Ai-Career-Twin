import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { login, register } = useAuth()
  const navigate  = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab mode: 'login' or 'signup'
  const [mode, setMode] = useState('login')

  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' })

  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [strength, setStrength] = useState(0)
  const [terms, setTerms] = useState(false)

  // Sync mode with query parameters
  useEffect(() => {
    const m = searchParams.get('mode')
    if (m === 'signup') {
      setMode('signup')
    } else {
      setMode('login')
    }
    setMsg(null)
    setErrors({})
  }, [searchParams])

  const handleTabChange = (targetMode) => {
    setSearchParams({ mode: targetMode })
  }

  // Password strength logic
  const calcStrength = (v) => {
    let s = 0
    if (v.length >= 8)           s++
    if (/[A-Z]/.test(v))         s++
    if (/[0-9]/.test(v))         s++
    if (/[^A-Za-z0-9]/.test(v)) s++
    setStrength(s)
  }

  const strengthLevels = [
    { w:'0%',   c:'transparent', t:'' },
    { w:'25%',  c:'#ef4444',     t:'Weak' },
    { w:'50%',  c:'#f59e0b',     t:'Fair' },
    { w:'75%',  c:'#3b82f6',     t:'Good' },
    { w:'100%', c:'#10b981',     t:'Strong' },
  ]

  // Validate Login
  const validateLogin = () => {
    const e = {}
    if (!loginForm.username.trim()) e.username = 'Enter your email or username.'
    if (!loginForm.password)        e.password = 'Enter your password.'
    setErrors(e)
    return !Object.keys(e).length
  }

  // Validate Signup
  const validateSignup = () => {
    const e = {}
    if (regForm.name.trim().length < 2)                             e.name     = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email))         e.email    = 'Enter a valid email address.'
    if (!/^[+\d\s\-]{7,15}$/.test(regForm.mobile))                 e.mobile   = 'Enter a valid mobile number.'
    if (regForm.password.length < 8)                                 e.password = 'Password must be at least 8 characters.'
    if (regForm.confirm !== regForm.password || !regForm.confirm)    e.confirm  = 'Passwords do not match.'
    if (!terms)                                                   e.terms    = 'Accept the terms to continue.'
    setErrors(e)
    return !Object.keys(e).length
  }

  // Handle Login Submit
  const handleLoginSubmit = async (ev) => {
    ev.preventDefault()
    if (!validateLogin()) return
    setLoading(true)
    setMsg(null)
    try {
      const data = await login(loginForm.username.trim(), loginForm.password)
      if (data.role === 'ADMIN') {
        setMsg({ type: 'success', text: '✓ Admin verified — loading control panel…' })
        setTimeout(() => navigate('/admin/dashboard'), 1000)
      } else {
        setMsg({ type: 'success', text: '✓ Login successful — redirecting to dashboard…' })
        setTimeout(() => navigate('/dashboard'), 1000)
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Invalid credentials. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Handle Signup Submit
  const handleSignupSubmit = async (ev) => {
    ev.preventDefault()
    if (!validateSignup()) return
    setLoading(true)
    setMsg(null)
    try {
      await register(regForm.email.trim(), regForm.password, regForm.name.trim(), regForm.mobile.trim())
      setMsg({ type: 'success', text: '✓ Account created successfully! Switching to login…' })
      
      // Auto-prefill and switch back to login
      setLoginForm({ username: regForm.email.trim(), password: regForm.password })
      setTimeout(() => {
        setSearchParams({ mode: 'login' })
      }, 1800)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const sl = strengthLevels[strength]

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Card */}
      <div className={`login-card fade-up ${mode === 'signup' ? 'mode-signup' : ''}`}>
        {/* Brand */}
        <Link to="/" className="login-brand">
          <div className="login-brand-icon">
            <i className="fa-solid fa-network-wired" />
          </div>
          <span className="login-brand-name">AI Career <span>Twin</span></span>
        </Link>

        {/* Tab Controls */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabChange('signup')}
          >
            Sign Up
          </button>
          <div className="tab-slider" />
        </div>

        {/* Header */}
        <div className="login-head">
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>
            {mode === 'login'
              ? 'Sign in to continue — students and admins use the same portal'
              : 'Start your AI-powered career journey today'}
          </p>
        </div>

        {msg && (
          <div className={`login-msg ${msg.type}`}>
            <i className={`fa-solid ${msg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
            {msg.text}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form-animate" noValidate>
            {/* Email / Username */}
            <div className={`login-field ${errors.username ? 'invalid' : ''}`}>
              <label htmlFor="login-username">Email or Username</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-envelope login-fi" />
                <input
                  id="login-username"
                  type="text"
                  placeholder="Enter your email or username"
                  value={loginForm.username}
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              <span className="login-field-err">{errors.username}</span>
            </div>

            {/* Password */}
            <div className={`login-field ${errors.password ? 'invalid' : ''}`}>
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-lock login-fi" />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  disabled={loading}
                >
                  <i className={`fa-solid ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              <span className="login-field-err">{errors.password}</span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-circle-notch fa-spin" /> Signing in…</>
              ) : (
                <><i className="fa-solid fa-arrow-right-to-bracket" /> Sign In</>
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form-animate" noValidate>
            {/* Full Name */}
            <div className={`login-field ${errors.name ? 'invalid' : regForm.name ? 'valid' : ''}`}>
              <label>Full Name</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-user login-fi" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  disabled={loading}
                />
              </div>
              <span className="login-field-err">{errors.name}</span>
            </div>

            {/* Email Address */}
            <div className={`login-field ${errors.email ? 'invalid' : regForm.email ? 'valid' : ''}`}>
              <label>Email Address</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-envelope login-fi" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  disabled={loading}
                />
              </div>
              <span className="login-field-err">{errors.email}</span>
            </div>

            {/* Mobile Number */}
            <div className={`login-field ${errors.mobile ? 'invalid' : regForm.mobile ? 'valid' : ''}`}>
              <label>Mobile Number</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-mobile-screen login-fi" />
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={regForm.mobile}
                  onChange={e => setRegForm({ ...regForm, mobile: e.target.value })}
                  disabled={loading}
                />
              </div>
              <span className="login-field-err">{errors.mobile}</span>
            </div>

            {/* Password */}
            <div className={`login-field ${errors.password ? 'invalid' : regForm.password.length >= 8 ? 'valid' : ''}`}>
              <label>Password</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-lock login-fi" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={regForm.password}
                  onChange={e => {
                    setRegForm({ ...regForm, password: e.target.value })
                    calcStrength(e.target.value)
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  disabled={loading}
                >
                  <i className={`fa-solid ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              <div className="str-track">
                <div className="str-fill" style={{ width: sl.w, background: sl.c }} />
              </div>
              {sl.t && <span className="str-lbl" style={{ color: sl.c }}>{sl.t}</span>}
              <span className="login-field-err">{errors.password}</span>
            </div>

            {/* Confirm Password */}
            <div className={`login-field ${errors.confirm ? 'invalid' : (regForm.confirm && regForm.confirm === regForm.password) ? 'valid' : ''}`}>
              <label>Confirm Password</label>
              <div className="login-input-wrap">
                <i className="fa-solid fa-shield-halved login-fi" />
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={regForm.confirm}
                  onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                  disabled={loading}
                />
              </div>
              <span className="login-field-err">{errors.confirm}</span>
            </div>

            <label className="terms-row">
              <input
                type="checkbox"
                checked={terms}
                onChange={e => setTerms(e.target.checked)}
                disabled={loading}
              />
              <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
            </label>
            {errors.terms && <span className="login-field-err" style={{ display: 'block', marginTop: -10, marginBottom: 10 }}>{errors.terms}</span>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin" /> Creating…</>
              ) : (
                <><i className="fa-solid fa-circle-nodes" /> Create Account</>
              )}
            </button>
          </form>
        )}

        <p className="login-switch">
          {mode === 'login' ? (
            <>Don't have an account? <a href="javascript:void(0)" onClick={() => handleTabChange('signup')}>Create Account</a></>
          ) : (
            <>Already have an account? <a href="javascript:void(0)" onClick={() => handleTabChange('login')}>Login</a></>
          )}
        </p>
      </div>

      <p className="login-foot">© 2026 AI Career Twin — B.E. CSE Final Year Project</p>
    </div>
  )
}
