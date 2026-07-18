import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import logo from '../assets/logo.png'
import './Auth.css'
import './Signup.css'

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

// ── Step indicators ──────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Details' },
    { n: 2, label: 'Verify'  },
    { n: 3, label: 'Done'    },
  ]
  return (
    <div className="step-indicator">
      {steps.map((s, i) => (
        <div key={s.n} className="step-item">
          <div className={`step-circle ${current === s.n ? 'active' : current > s.n ? 'done' : ''}`}>
            {current > s.n
              ? <i className="fa-solid fa-check" />
              : s.n}
          </div>
          <span className={`step-label ${current === s.n ? 'active' : ''}`}>{s.label}</span>
          {i < steps.length - 1 && (
            <div className={`step-line ${current > s.n ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── OTP input boxes ──────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null))

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) refs[i - 1].current?.focus()
    }
  }

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[i] = ch
    const next = arr.join('').padEnd(6, '')
    onChange(next)
    if (ch && i < 5) refs[i + 1].current?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(paste.padEnd(6, ''))
    const focusIdx = Math.min(paste.length, 5)
    refs[focusIdx].current?.focus()
  }

  return (
    <div className="otp-boxes">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-box ${value[i] ? 'filled' : ''}`}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ── Main Signup component ────────────────────────────────────────────────────
export default function Signup() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  // Step: 1 = details form, 2 = OTP verify, 3 = success
  const [step, setStep] = useState(1)

  // Form data
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' })
  const [errors, setErrors]   = useState({})
  const [msg, setMsg]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [strength, setStrength] = useState(0)
  const [terms, setTerms]     = useState(false)

  // Country selector
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0])
  const [showDropdown, setShowDropdown]       = useState(false)
  const [searchQuery, setSearchQuery]         = useState('')
  const dropdownRef = useRef(null)

  // OTP state
  const [otp, setOtp]           = useState('')
  const [otpToken, setOtpToken] = useState('')   // verification token from /verify-otp
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef(null)

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

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [resendTimer])

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  )

  const strengthLevels = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '25%',  c: '#ef4444',     t: 'Weak' },
    { w: '50%',  c: '#f59e0b',     t: 'Fair' },
    { w: '75%',  c: '#3b82f6',     t: 'Good' },
    { w: '100%', c: '#10b981',     t: 'Strong' },
  ]

  const calcStrength = (v) => {
    let s = 0
    if (v.length >= 8)           s++
    if (/[A-Z]/.test(v))         s++
    if (/[0-9]/.test(v))         s++
    if (/[^A-Za-z0-9]/.test(v)) s++
    setStrength(s)
  }

  const handleMobileChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length <= 10) setForm({ ...form, mobile: raw })
  }

  // ── Step 1 validation ──
  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2)                             e.name     = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))         e.email    = 'Enter a valid email address.'
    if (!/^\d{10}$/.test(form.mobile))                           e.mobile   = 'Enter exactly 10 digit mobile number.'
    if (form.password.length < 8)                                e.password = 'Password must be at least 8 characters.'
    if (form.confirm !== form.password || !form.confirm)         e.confirm  = 'Passwords do not match.'
    if (!terms)                                                  e.terms    = 'Accept the terms to continue.'
    setErrors(e)
    return !Object.keys(e).length
  }

  // ── Step 1 → send OTP ──
  const handleSendOtp = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setMsg(null)
    try {
      const res = await api.post('/send-otp', { email: form.email.trim() })
      setMsg({ type: 'success', text: res.data.message || 'Verification code sent!' })
      setStep(2)
      setOtp('')
      setResendTimer(30)
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send OTP. Please try again.'
      setMsg({ type: 'error', text: errMsg })
    } finally { setLoading(false) }
  }

  // ── Step 2 → verify OTP → register ──
  const handleVerifyAndRegister = async (ev) => {
    ev.preventDefault()
    if (otp.replace(/\D/g, '').length < 6) {
      setMsg({ type: 'error', text: 'Please enter the complete 6-digit code.' })
      return
    }
    setLoading(true); setMsg(null)
    try {
      // Verify OTP
      const verRes = await api.post('/verify-otp', { email: form.email.trim(), otp: otp.trim() })
      const token = verRes.data.token

      // Register with verification token
      const fullMobile = `${selectedCountry.code} ${form.mobile}`
      await register(form.email.trim(), form.password, form.name.trim(), fullMobile.trim(), token)

      setStep(3)
      setMsg({ type: 'success', text: 'Account created successfully!' })
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Verification failed. Please try again.'
      setMsg({ type: 'error', text: errMsg })
    } finally { setLoading(false) }
  }

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendTimer > 0) return
    setLoading(true); setMsg(null); setOtp('')
    try {
      const res = await api.post('/send-otp', { email: form.email.trim() })
      setMsg({ type: 'success', text: 'New verification code sent!' })
      setResendTimer(30)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to resend OTP.' })
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

        <StepIndicator current={step} />

        {/* ── STEP 1: Account Details ── */}
        {step === 1 && (
          <>
            <div className="auth-head">
              <h1>Create your account</h1>
              <p>Fill in your details to get started</p>
            </div>

            {msg && <div className={`msg-box ${msg.type}`}>{msg.text}</div>}

            <form onSubmit={handleSendOtp} noValidate>
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

              {/* Mobile */}
              <div className={`field ${errors.mobile ? 'invalid' : form.mobile.length === 10 ? 'valid' : ''}`}>
                <label>Mobile Number</label>
                <div className="mobile-row">
                  <div className="country-selector" ref={dropdownRef}>
                    <button type="button" className="country-btn"
                      onClick={() => { setShowDropdown(!showDropdown); setSearchQuery('') }}>
                      <span className="country-flag">{selectedCountry.flag}</span>
                      <span className="country-code">{selectedCountry.code}</span>
                      <i className={`fa-solid fa-chevron-down country-arrow ${showDropdown ? 'open' : ''}`}/>
                    </button>
                    {showDropdown && (
                      <div className="country-dropdown">
                        <div className="country-search-wrap">
                          <i className="fa-solid fa-magnifying-glass country-search-icon"/>
                          <input type="text" className="country-search" placeholder="Search country..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus/>
                        </div>
                        <ul className="country-list">
                          {filteredCountries.map((c, i) => (
                            <li key={`${c.code}-${c.name}-${i}`}
                              className={`country-option ${c.name === selectedCountry.name ? 'selected' : ''}`}
                              onClick={() => { setSelectedCountry(c); setShowDropdown(false); setSearchQuery('') }}>
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
                    <input type="tel" placeholder="Enter 10 digit number"
                      value={form.mobile} onChange={handleMobileChange}
                      maxLength={10} inputMode="numeric"/>
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
                {form.password && (
                  <div className="pwd-strength-bar">
                    <div className="pwd-strength-fill" style={{ width: sl.w, background: sl.c }}/>
                  </div>
                )}
                <div className="pwd-checklist">
                  <span className={`chk-item ${form.password.length >= 8 ? 'pass' : ''}`}>
                    <i className={`fa-solid ${form.password.length >= 8 ? 'fa-circle-check' : 'fa-circle-dot'}`}/> Min 8 chars
                  </span>
                  <span className={`chk-item ${/[A-Z]/.test(form.password) ? 'pass' : ''}`}>
                    <i className={`fa-solid ${/[A-Z]/.test(form.password) ? 'fa-circle-check' : 'fa-circle-dot'}`}/> 1 Uppercase
                  </span>
                  <span className={`chk-item ${/[0-9]/.test(form.password) ? 'pass' : ''}`}>
                    <i className={`fa-solid ${/[0-9]/.test(form.password) ? 'fa-circle-check' : 'fa-circle-dot'}`}/> 1 Number
                  </span>
                  <span className={`chk-item ${/[^A-Za-z0-9]/.test(form.password) ? 'pass' : ''}`}>
                    <i className={`fa-solid ${/[^A-Za-z0-9]/.test(form.password) ? 'fa-circle-check' : 'fa-circle-dot'}`}/> 1 Special
                  </span>
                </div>
                <span className="field-err">{errors.password}</span>
              </div>

              {/* Confirm Password */}
              <div className={`field ${errors.confirm ? 'invalid' : (form.confirm && form.confirm === form.password) ? 'valid' : ''}`}>
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
                  ? <><i className="fa-solid fa-spinner fa-spin"/> Sending Code…</>
                  : <><i className="fa-solid fa-paper-plane"/> Send Verification Code</>}
              </button>
            </form>

            <p className="switch-link">Already have an account? <Link to="/login">Login</Link></p>
          </>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 2 && (
          <>
            <div className="auth-head">
              <h1>Check your email</h1>
              <p>We sent a 6-digit code to<br/><strong className="otp-email-highlight">{form.email}</strong></p>
            </div>

            {msg && <div className={`msg-box ${msg.type}`}>{msg.text}</div>}

            <form onSubmit={handleVerifyAndRegister} noValidate>
              <div className="otp-section">
                <OtpBoxes value={otp} onChange={setOtp} />
                <p className="otp-hint">Enter the 6-digit code sent to your inbox</p>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.replace(/\D/g,'').length < 6}>
                {loading
                  ? <><i className="fa-solid fa-spinner fa-spin"/> Verifying…</>
                  : <><i className="fa-solid fa-shield-check"/> Verify & Create Account</>}
              </button>

              <div className="otp-resend-row">
                <span>Didn't receive it?</span>
                <button type="button" className="resend-btn" onClick={handleResend} disabled={resendTimer > 0 || loading}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>

              <button type="button" className="back-btn" onClick={() => { setStep(1); setMsg(null) }}>
                <i className="fa-solid fa-arrow-left"/> Back to Details
              </button>
            </form>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <div className="success-state">
            <div className="success-icon">
              <i className="fa-solid fa-circle-check"/>
            </div>
            <h2>Account Created!</h2>
            <p>Your email has been verified and your account is ready. Redirecting to login…</p>
            <div className="success-loader">
              <div className="success-loader-fill"/>
            </div>
          </div>
        )}
      </div>

      <p className="auth-foot">© 2026 AI Career Twin</p>
    </div>
  )
}
