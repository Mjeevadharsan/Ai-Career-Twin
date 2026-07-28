import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import './Auth.css'

const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
]

export default function Signup() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ name:'', email:'', mobile:'', password:'', confirm:'' })
  const [errors, setErrors]   = useState({})
  const [msg, setMsg]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [strength, setStrength] = useState(0)
  const [terms, setTerms]     = useState(false)

  // Country code state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]) // India default
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  )

  const strengthLevels = [
    { w:'0%',   c:'transparent', t:'' },
    { w:'25%',  c:'#ef4444',     t:'Weak' },
    { w:'50%',  c:'#f59e0b',     t:'Fair' },
    { w:'75%',  c:'#3b82f6',     t:'Good' },
    { w:'100%', c:'#10b981',     t:'Strong' },
  ]

  const calcStrength = (v) => {
    let s = 0
    if (v.length >= 8)           s++
    if (/[A-Z]/.test(v))         s++
    if (/[0-9]/.test(v))         s++
    if (/[^A-Za-z0-9]/.test(v)) s++
    setStrength(s)
  }

  // Allow only digits in mobile, max 10
  const handleMobileChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length <= 10) {
      setForm({ ...form, mobile: raw })
    }
  }

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2)                              e.name     = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))         e.email    = 'Enter a valid email address.'
    if (!/^\d{10}$/.test(form.mobile))                            e.mobile   = 'Enter exactly 10 digit mobile number.'
    if (form.password.length < 8)                                 e.password = 'Password must be at least 8 characters.'
    if (form.confirm !== form.password || !form.confirm)          e.confirm  = 'Passwords do not match.'
    if (!terms)                                                   e.terms    = 'Accept the terms to continue.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setMsg(null)
    const fullMobile = `${selectedCountry.code} ${form.mobile}`
    try {
      await register(form.email.trim(), form.password, form.name.trim(), fullMobile.trim())
      setMsg({ type:'success', text:'Account created! Redirecting to login…' })
      setTimeout(() => navigate('/login'), 1600)
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.error || 'Registration failed.' })
    } finally { setLoading(false) }
  }

  const sl = strengthLevels[strength]

  return (
    <div className="auth-page">
      <div className="auth-orbs">
        <div className="orb o1"/><div className="orb o2"/>
      </div>
      <div className="auth-card fade-up">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <img src={logo} alt="Logo" className="brand-logo-img" />
          </div>
          <span className="brand-name">AI Career <span>Twin</span></span>
        </Link>

        <div className="auth-head">
          <h1>Create your account</h1>
          <p>Start your AI-powered career journey today</p>
        </div>

        {msg && <div className={`msg-box ${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className={`field ${errors.name ? 'invalid' : form.name ? 'valid' : ''}`}>
            <label>Full Name</label>
            <div className="input-wrap">
              <i className="fa-solid fa-user fi"/>
              <input type="text" placeholder="Enter your full name"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}/>
            </div>
            <span className="field-err">{errors.name}</span>
          </div>

          {/* Email */}
          <div className={`field ${errors.email ? 'invalid' : form.email ? 'valid' : ''}`}>
            <label>Email Address</label>
            <div className="input-wrap">
              <i className="fa-solid fa-envelope fi"/>
              <input type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}/>
            </div>
            <span className="field-err">{errors.email}</span>
          </div>

          {/* Mobile Number with Country Code */}
          <div className={`field ${errors.mobile ? 'invalid' : form.mobile.length === 10 ? 'valid' : ''}`}>
            <label>Mobile Number</label>
            <div className="mobile-row">
              <div className="country-selector" ref={dropdownRef}>
                <button
                  type="button"
                  className="country-btn"
                  onClick={() => { setShowDropdown(!showDropdown); setSearchQuery('') }}
                >
                  <span className="country-flag">{selectedCountry.flag}</span>
                  <span className="country-code">{selectedCountry.code}</span>
                  <i className={`fa-solid fa-chevron-down country-arrow ${showDropdown ? 'open' : ''}`}/>
                </button>
                {showDropdown && (
                  <div className="country-dropdown">
                    <div className="country-search-wrap">
                      <i className="fa-solid fa-magnifying-glass country-search-icon"/>
                      <input
                        type="text"
                        className="country-search"
                        placeholder="Search country..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <ul className="country-list">
                      {filteredCountries.map((c, i) => (
                        <li
                          key={`${c.code}-${c.name}-${i}`}
                          className={`country-option ${c.name === selectedCountry.name ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCountry(c)
                            setShowDropdown(false)
                            setSearchQuery('')
                          }}
                        >
                          <span className="country-flag">{c.flag}</span>
                          <span className="country-name">{c.name}</span>
                          <span className="country-dial">{c.code}</span>
                        </li>
                      ))}
                      {filteredCountries.length === 0 && (
                        <li className="country-no-result">No countries found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="input-wrap mobile-input-wrap">
                <input
                  type="tel"
                  placeholder="Enter 10 digit number"
                  value={form.mobile}
                  onChange={handleMobileChange}
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
            </div>
            <span className="field-err">{errors.mobile}</span>
          </div>

          {/* Password */}
          <div className={`field ${errors.password ? 'invalid' : form.password.length >= 8 ? 'valid' : ''}`}>
            <label>Password</label>
            <div className="input-wrap">
              <i className="fa-solid fa-lock fi"/>
              <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => { setForm({...form, password: e.target.value}); calcStrength(e.target.value) }}/>
              <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                <i className={`fa-solid ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}/>
              </button>
            </div>
            <div className="str-track"><div className="str-fill" style={{ width:sl.w, background:sl.c }}/></div>
            {sl.t && <span className="str-lbl" style={{ color:sl.c }}>{sl.t}</span>}
            <span className="field-err">{errors.password}</span>
          </div>

          {/* Confirm */}
          <div className={`field ${errors.confirm ? 'invalid' : (form.confirm && form.confirm===form.password) ? 'valid' : ''}`}>
            <label>Confirm Password</label>
            <div className="input-wrap">
              <i className="fa-solid fa-shield-halved fi"/>
              <input type="password" placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => setForm({...form, confirm: e.target.value})}/>
            </div>
            <span className="field-err">{errors.confirm}</span>
          </div>

          <label className="terms-row">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}/>
            <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
          </label>
          {errors.terms && <span className="field-err" style={{display:'block',marginTop:-10,marginBottom:10}}>{errors.terms}</span>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"/> Creating…</>
              : <><i className="fa-solid fa-circle-nodes"/> Create Account</>}
          </button>
        </form>

        <p className="switch-link">Already have an account? <Link to="/login">Login</Link></p>
      </div>
      <p className="auth-foot">© 2026 AI Career Twin — B.E. CSE Final Year Project</p>
    </div>
  )
}
