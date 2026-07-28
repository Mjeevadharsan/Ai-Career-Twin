import { useState, useEffect } from 'react'
import { useAuth }  from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../services/profileService'
import { updateSettings, changePassword, deleteAccount } from '../services/authService'
import './PageShared.css'
import './Settings.css'

export default function Settings() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // Navigation
  const [activeTab, setActiveTab] = useState('personal')

  // Personal Info Form State
  const [personalForm, setPersonalForm] = useState({
    fullName: '',
    mobile: '',
    email: ''
  })
  
  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Danger Zone confirmation
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Status Alerts
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load User Details
  useEffect(() => {
    setLoading(true)
    getProfile()
      .then(res => {
        setPersonalForm({
          fullName: res.data.full_name || '',
          mobile: res.data.mobile || '',
          email: res.data.username || ''
        })
      })
      .catch(() => {
        showAlert('error', 'Failed to retrieve profile information.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const showAlert = (type, text) => {
    setAlert({ type, text })
    setTimeout(() => setAlert(null), 4000)
  }

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!personalForm.fullName.trim()) {
      showAlert('error', 'Full name cannot be empty.')
      return
    }
    setLoading(true)
    try {
      const res = await updateSettings({
        fullName: personalForm.fullName.trim(),
        mobile: personalForm.mobile.trim()
      })
      updateUser({ fullName: personalForm.fullName.trim() })
      showAlert('success', res.data.message || 'Personal settings saved successfully!')
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'Failed to update personal settings.')
    } finally {
      setLoading(false)
    }
  }

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!securityForm.currentPassword || !securityForm.newPassword) {
      showAlert('error', 'Please fill in all password fields.')
      return
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showAlert('error', 'New passwords do not match.')
      return
    }
    if (securityForm.newPassword.length < 4) {
      showAlert('error', 'New password must be at least 4 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword
      })
      showAlert('success', res.data.message || 'Password updated successfully!')
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  // Delete Account
  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    if (!deleteConfirmPassword) {
      showAlert('error', 'Please verify your password to delete your account.')
      return
    }
    setLoading(true)
    try {
      await deleteAccount()
      await logout()
      navigate('/')
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'Account deletion failed.')
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
      setDeleteConfirmPassword('')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Get user avatar initials
  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="settings-page-wrapper shared-page">
      <div className="page-header">
        <h1><i className="fa-solid fa-user-gear text-accent"/> Account Management</h1>
        <p>Control, secure, and monitor your personal settings</p>
      </div>

      {alert && (
        <div className={`settings-alert fade-up alert-${alert.type}`}>
          <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
          {alert.text}
        </div>
      )}

      <div className="google-settings-container glass-card">
        {/* Left Navigation Sidebar */}
        <aside className="settings-sidebar">
          <div className="sidebar-avatar-section">
            <div className="avatar-circle-gradient">
              {getInitials(personalForm.fullName || user?.fullName || user?.username)}
            </div>
            <h3>{personalForm.fullName || user?.fullName || 'User'}</h3>
            <p>{personalForm.email || user?.username}</p>
          </div>

          <nav className="sidebar-tabs-nav">
            <button
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <i className="fa-solid fa-circle-user" /> Personal info
            </button>
            <button
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <i className="fa-solid fa-shield-halved" /> Security settings
            </button>
            <button
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'project' ? 'active' : ''}`}
              onClick={() => setActiveTab('project')}
            >
              <i className="fa-solid fa-circle-info" /> Academic info
            </button>
            <button
              type="button"
              className={`sidebar-tab-btn tab-btn-danger ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              <i className="fa-solid fa-triangle-exclamation" /> Danger zone
            </button>
          </nav>
        </aside>

        {/* Right Tab Panel Content */}
        <main className="settings-content-panel">
          {loading && (
            <div className="panel-loading-overlay">
              <i className="fa-solid fa-spinner fa-spin fa-2x text-accent" />
            </div>
          )}

          {/* TAB 1: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="tab-panel-content fade-up">
              <h2>Personal Information</h2>
              <p className="tab-panel-sub">Details about your identity and account access values.</p>
              
              <form onSubmit={handleSaveSettings} className="settings-form">
                <div className="settings-field-group">
                  <label>Email Address / Username</label>
                  <div className="settings-input-wrapper readonly-wrapper">
                    <i className="fa-solid fa-envelope field-icon" />
                    <input
                      type="text"
                      value={personalForm.email}
                      readOnly
                      disabled
                      title="Username/Email cannot be updated"
                    />
                    <i className="fa-solid fa-lock suffix-icon" title="Locked by system" />
                  </div>
                  <span className="field-hint">Primary username used for authentication. Cannot be modified.</span>
                </div>

                <div className="settings-field-group">
                  <label>Full Name</label>
                  <div className="settings-input-wrapper">
                    <i className="fa-solid fa-user field-icon" />
                    <input
                      type="text"
                      value={personalForm.fullName}
                      onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="settings-field-group">
                  <label>Mobile Number</label>
                  <div className="settings-input-wrapper">
                    <i className="fa-solid fa-phone field-icon" />
                    <input
                      type="text"
                      value={personalForm.mobile}
                      onChange={e => setPersonalForm({ ...personalForm, mobile: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <i className="fa-solid fa-floppy-disk" /> Save Profile Details
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div className="tab-panel-content fade-up">
              <h2>Security &amp; Password</h2>
              <p className="tab-panel-sub">Change your account credentials to keep your profile secure.</p>

              <form onSubmit={handleUpdatePassword} className="settings-form">
                <div className="settings-field-group">
                  <label>Current Password</label>
                  <div className="settings-input-wrapper">
                    <i className="fa-solid fa-lock field-icon" />
                    <input
                      type="password"
                      placeholder="Enter your current password"
                      value={securityForm.currentPassword}
                      onChange={e => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="settings-field-group">
                  <label>New Password</label>
                  <div className="settings-input-wrapper">
                    <i className="fa-solid fa-key field-icon" />
                    <input
                      type="password"
                      placeholder="Minimum 4 characters"
                      value={securityForm.newPassword}
                      onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="settings-field-group">
                  <label>Confirm New Password</label>
                  <div className="settings-input-wrapper">
                    <i className="fa-solid fa-shield-halved field-icon" />
                    <input
                      type="password"
                      placeholder="Re-enter your new password"
                      value={securityForm.confirmPassword}
                      onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <i className="fa-solid fa-key" /> Update Password
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PROJECT INFO */}
          {activeTab === 'project' && (
            <div className="tab-panel-content fade-up">
              <h2>Academic Project Info</h2>
              <p className="tab-panel-sub">Meta-parameters detailing this AI guidance model system.</p>

              <div className="settings-about-grid">
                {[
                  { label: 'Project Name', value: 'AI Career Twin', icon: 'fa-graduation-cap' },
                  { label: 'Course Code', value: 'B.E. Computer Science & Engineering', icon: 'fa-book-open' },
                  { label: 'Academic Session', value: 'Final Year Project – 2026', icon: 'fa-calendar-days' },
                  { label: 'Research Scope', value: 'AI · ML · Career Guidance · Data Analytics', icon: 'fa-magnifying-glass' },
                  { label: 'Backend Database', value: 'Java Spring Boot + MySQL / SQLite', icon: 'fa-database' },
                  { label: 'ML Algorithm', value: 'K-Nearest Neighbors (K=15 Classifier)', icon: 'fa-circle-nodes' }
                ].map(r => (
                  <div key={r.label} className="settings-info-card">
                    <div className="info-icon-container">
                      <i className={`fa-solid ${r.icon}`} />
                    </div>
                    <div className="info-meta-container">
                      <span className="info-label">{r.label}</span>
                      <span className="info-value">{r.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="tab-panel-content fade-up">
              <h2>Danger Zone &amp; Account Actions</h2>
              <p className="tab-panel-sub">Actions that are destructive or will invalidate your session.</p>

              <div className="danger-cards-row">
                {/* Logout Card */}
                <div className="settings-danger-card border-orange">
                  <div className="danger-card-body">
                    <h3>Sign Out of Session</h3>
                    <p>Logout of the current device. Your local cache token will be removed.</p>
                  </div>
                  <div className="danger-card-action">
                    {!confirmLogout ? (
                      <button type="button" className="btn btn-outline" onClick={() => setConfirmLogout(true)}>
                        <i className="fa-solid fa-arrow-right-from-bracket" /> Logout
                      </button>
                    ) : (
                      <div className="danger-confirm-box">
                        <span>Are you sure?</span>
                        <div className="danger-confirm-btns">
                          <button type="button" className="btn btn-primary" onClick={handleLogout}>
                            Yes
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmLogout(false)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Account Card */}
                <div className="settings-danger-card border-red">
                  <div className="danger-card-body">
                    <h3>Permanently Delete Account</h3>
                    <p>Delete your profile, CGPA records, ML career predictions, and test history. This action cannot be undone.</p>
                  </div>
                  <div className="danger-card-action">
                    <button type="button" className="btn btn-danger-action" onClick={() => setShowDeleteModal(true)}>
                      <i className="fa-solid fa-trash-can" /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- DELETION VERIFICATION MODAL --- */}
      {showDeleteModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal glass-card">
            <div className="modal-header-danger">
              <i className="fa-solid fa-triangle-exclamation warning-icon" />
              <h3>Confirm Permanent Account Deletion</h3>
            </div>
            <div className="modal-body-danger">
              <p>You are about to permanently delete your AI Career Twin profile. This will remove all your data, including career projections, test parameters, and credentials from our system.</p>
              <p className="bold-alert">To proceed, please click the button below to authorize and permanently delete your account.</p>
            </div>
            <div className="modal-footer-danger">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger-action"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
