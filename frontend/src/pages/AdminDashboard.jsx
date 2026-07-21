import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // States
  const [stats, setStats] = useState({
    total_students: 0,
    students_with_profiles: 0,
    logins_today: 0,
    signups_today: 0
  })
  const [students, setStudents] = useState([])
  const [loginHistory, setLoginHistory] = useState([])
  const [activities, setActivities] = useState([])
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [profileFilter, setProfileFilter] = useState('all') // 'all', 'completed', 'pending'
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', '7days', '30days'
  const [sortKey, setSortKey] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Deletion Modal & Detail View State
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, studentId: null, studentName: '' })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  
  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [statsRes, studentsRes, historyRes, activitiesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/students'),
        api.get('/admin/login-history?limit=30'),
        api.get('/admin/activities?limit=35')
      ])
      
      setStats(statsRes.data)
      setStudents(studentsRes.data)
      setLoginHistory(historyRes.data)
      setActivities(activitiesRes.data)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setActionMsg({ type: 'error', text: 'Error loading admin data. Session may have expired.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Real-time Activity Monitoring & Stats Polling every 5 seconds
    const interval = setInterval(async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/activities?limit=35')
        ])
        setStats(statsRes.data)
        setActivities(activitiesRes.data)
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Handle student delete
  const handleDeleteClick = (student) => {
    setDeleteConfirm({
      open: true,
      studentId: student.id,
      studentName: student.full_name || student.username
    })
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/students/${deleteConfirm.studentId}`)
      setActionMsg({ type: 'success', text: `Successfully deleted account: ${deleteConfirm.studentName}` })
      setDeleteConfirm({ open: false, studentId: null, studentName: '' })
      
      // Refresh list
      fetchData()
    } catch (err) {
      console.error('Deletion error:', err)
      setActionMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete student.' })
    } finally {
      setDeleting(false)
      setTimeout(() => setActionMsg(null), 3000)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin-login')
  }

  // Filter & Sort student list
  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      (s.username && s.username.toLowerCase().includes(term)) ||
      (s.full_name && s.full_name.toLowerCase().includes(term)) ||
      (s.mobile && s.mobile.toLowerCase().includes(term))
      
    let matchesProfile = true
    if (profileFilter === 'completed') matchesProfile = s.has_profile
    if (profileFilter === 'pending') matchesProfile = !s.has_profile

    let matchesDate = true
    if (dateFilter !== 'all' && s.created_at) {
      const created = new Date(s.created_at)
      const now = new Date()
      if (dateFilter === 'today') {
        matchesDate = created.toDateString() === now.toDateString()
      } else if (dateFilter === '7days') {
        const diffDays = Math.ceil(Math.abs(now - created) / (1000 * 60 * 60 * 24))
        matchesDate = diffDays <= 7
      } else if (dateFilter === '30days') {
        const diffDays = Math.ceil(Math.abs(now - created) / (1000 * 60 * 60 * 24))
        matchesDate = diffDays <= 30
      }
    }

    return matchesSearch && matchesProfile && matchesDate
  })

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let valA = a[sortKey]
    let valB = b[sortKey]
    
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const requestSort = (key) => {
    let order = 'asc'
    if (sortKey === key && sortOrder === 'asc') {
      order = 'desc'
    }
    setSortKey(key)
    setSortOrder(order)
  }

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString()
  }

  // Render Loader
  if (loading) return (
    <div className="admin-loader">
      <i className="fa-solid fa-circle-notch fa-spin fa-3x text-accent"></i>
      <p>Configuring Admin Interface...</p>
    </div>
  )

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <span>Admin Console</span>
        </div>
        
        <div className="admin-profile-section">
          <div className="admin-avatar">
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div className="admin-meta">
            <h4>{user?.fullName || 'Administrator'}</h4>
            <span>{user?.username}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fa-solid fa-chart-line"></i> Dashboard Overview
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <i className="fa-solid fa-users-gear"></i> Manage Students
          </button>

          <button 
            className={`nav-item ${activeTab === 'logins' ? 'active' : ''}`}
            onClick={() => setActiveTab('logins')}
          >
            <i className="fa-solid fa-history"></i> Login Logs
          </button>

          <button 
            className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <i className="fa-solid fa-pulse"></i> Real-time Audit
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout-admin">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Exit Panel
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main">
        {/* Header Bar */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Navigation Drawer"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2>
              {activeTab === 'overview' && 'Console Control Dashboard'}
              {activeTab === 'students' && 'Student Profile Directory'}
              {activeTab === 'logins' && 'Authentication History Tracking'}
              {activeTab === 'activity' && 'Real-time System Audit logs'}
            </h2>
          </div>
          <div className="header-right">
            <span className="live-indicator">
              <span className="pulse-dot"></span> LIVE MONITOR
            </span>
          </div>
        </header>

        {/* Global Notifications */}
        {actionMsg && (
          <div className={`msg-box ${actionMsg.type} fade-up admin-notif`}>
            <i className={`fa-solid ${actionMsg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {actionMsg.text}
          </div>
        )}

        {/* --- Tab Content --- */}
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="tab-pane overview-pane fade-up">
            {/* Quick Statistics Row */}
            <div className="stats-row">
              <div className="admin-stat-card glass-card border-blue">
                <div className="stat-head">
                  <span>Total Registered Students</span>
                  <i className="fa-solid fa-user-group color-blue"></i>
                </div>
                <div className="stat-number">{stats.total_students}</div>
                <div className="stat-foot">Student accounts in database</div>
              </div>

              <div className="admin-stat-card glass-card border-purple">
                <div className="stat-head">
                  <span>Twin Profiles Created</span>
                  <i className="fa-solid fa-circle-nodes color-purple"></i>
                </div>
                <div className="stat-number">{stats.students_with_profiles}</div>
                <div className="stat-foot">
                  {stats.total_students > 0 
                    ? `${Math.round((stats.students_with_profiles / stats.total_students) * 100)}% completion rate`
                    : '0% completion rate'
                  }
                </div>
              </div>

              <div className="admin-stat-card glass-card border-green">
                <div className="stat-head">
                  <span>Active Logins Today</span>
                  <i className="fa-solid fa-bolt color-green"></i>
                </div>
                <div className="stat-number">{stats.logins_today}</div>
                <div className="stat-foot">Authentication sessions recorded today</div>
              </div>

              <div className="admin-stat-card glass-card border-orange">
                <div className="stat-head">
                  <span>Signups Today</span>
                  <i className="fa-solid fa-user-plus color-orange"></i>
                </div>
                <div className="stat-number">{stats.signups_today}</div>
                <div className="stat-foot">New accounts registered in last 24h</div>
              </div>
            </div>

            {/* Quick views */}
            <div className="overview-split">
              {/* Left Side: Recent Signups Table */}
              <div className="glass-card table-card">
                <div className="card-header-row">
                  <h3><i className="fa-solid fa-users text-accent"></i> Recently Registered</h3>
                  <button className="btn-text" onClick={() => setActiveTab('students')}>View All Directory</button>
                </div>
                
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student / Account</th>
                        <th>Registered On</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 5).map(s => (
                        <tr key={s.id}>
                          <td>
                            <div className="name-cell">
                              <strong>{s.full_name || 'N/A'}</strong>
                              <span>{s.username}</span>
                            </div>
                          </td>
                          <td>{formatDate(s.created_at)}</td>
                          <td>
                            <span className={`badge ${s.has_profile ? 'badge-green' : 'badge-orange'}`}>
                              {s.has_profile ? 'Twin Ready' : 'Pending Profile'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="3" className="empty-row">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Live Activity Stream */}
              <div className="glass-card feed-card">
                <div className="card-header-row">
                  <h3><i className="fa-solid fa-wave-square text-accent"></i> Real-time Activities</h3>
                  <button className="btn-text" onClick={() => setActiveTab('activity')}>View Full Audit</button>
                </div>
                
                <div className="mini-feed">
                  {activities.slice(0, 6).map(act => (
                    <div key={act.id} className="feed-item">
                      <div className="feed-dot" data-action={act.action}></div>
                      <div className="feed-body">
                        <p>
                          <strong>{act.username}</strong> {act.details}
                        </p>
                        <span className="feed-time">{formatDate(act.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="empty-feed">No recent events logged.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="tab-pane students-pane fade-up">
            <div className="glass-card controls-card">
              <div className="controls-row">
                <div className="search-box">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input 
                    type="text" 
                    placeholder="Search by full name, email, or mobile..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <label>Registration Period:</label>
                  <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                    <option value="all">All Days (All History)</option>
                    <option value="today">Registered Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Twin Status:</label>
                  <select value={profileFilter} onChange={e => setProfileFilter(e.target.value)}>
                    <option value="all">All Students</option>
                    <option value="completed">Twin Ready</option>
                    <option value="pending">Pending Profile</option>
                  </select>
                </div>

                <div className="stats-indicator">
                  Showing <strong>{sortedStudents.length}</strong> of {students.length} students
                </div>
              </div>

              <div className="table-responsive full-table-responsive">
                <table className="admin-table sticky-header">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('full_name')} className="sortable">
                        Student Name {sortKey === 'full_name' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => requestSort('username')} className="sortable">
                        Username/Email {sortKey === 'username' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th>Mobile</th>
                      <th>Password</th>
                      <th onClick={() => requestSort('cgpa')} className="sortable numeric">
                        CGPA {sortKey === 'cgpa' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => requestSort('projects')} className="sortable numeric">
                        Projects {sortKey === 'projects' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => requestSort('certifications')} className="sortable numeric">
                        Certs {sortKey === 'certifications' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => requestSort('login_count')} className="sortable numeric">
                        Logins {sortKey === 'login_count' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => requestSort('created_at')} className="sortable">
                        Registered Date {sortKey === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th onClick={() => requestSort('last_login')} className="sortable">
                        Last Active {sortKey === 'last_login' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="action-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="student-profile-cell">
                            <div className="student-icon">
                              <i className="fa-solid fa-user-graduate"></i>
                            </div>
                            <strong>{s.full_name || 'Not Filled'}</strong>
                          </div>
                        </td>
                        <td>{s.username}</td>
                        <td>{s.mobile || '—'}</td>
                        <td>
                          {s.plain_password ? (
                            <div className="password-cell">
                              <input
                                type={visiblePasswords[s.id] ? "text" : "password"}
                                value={s.plain_password}
                                readOnly
                                className="admin-pwd-input"
                              />
                              <button
                                type="button"
                                className="btn-toggle-pwd"
                                onClick={() => togglePasswordVisibility(s.id)}
                                title={visiblePasswords[s.id] ? "Hide Password" : "Show Password"}
                              >
                                <i className={`fa-solid ${visiblePasswords[s.id] ? "fa-eye-slash" : "fa-eye"}`}></i>
                              </button>
                            </div>
                          ) : (
                            <span className="no-pwd">N/A</span>
                          )}
                        </td>
                        <td className="numeric font-mono">
                          {s.cgpa !== null ? parseFloat(s.cgpa).toFixed(2) : '—'}
                        </td>
                        <td className="numeric font-mono">{s.projects !== null ? s.projects : '—'}</td>
                        <td className="numeric font-mono">{s.certifications !== null ? s.certifications : '—'}</td>
                        <td className="numeric font-mono">{s.login_count}</td>
                        <td className="font-small">{formatDate(s.created_at)}</td>
                        <td className="font-small">{formatDate(s.last_login)}</td>
                        <td className="action-col">
                          <div className="action-btns-group">
                            <button 
                              onClick={() => setSelectedStudent(s)} 
                              className="btn-view"
                              title="View Complete Student Details"
                            >
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(s)} 
                              className="btn-delete"
                              title="Delete Student Account"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedStudents.length === 0 && (
                      <tr>
                        <td colSpan="11" className="empty-row">No students found matching current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. LOGINS TAB */}
        {activeTab === 'logins' && (
          <div className="tab-pane logins-pane fade-up">
            <div className="glass-card">
              <div className="card-header-row">
                <h3><i className="fa-solid fa-clock-rotate-left text-accent"></i> Access Authentication History</h3>
                <span className="info-lbl">Recent 30 log records displayed</span>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time of Session</th>
                      <th>Account Name</th>
                      <th>Email ID</th>
                      <th>Privilege Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((lh, i) => (
                      <tr key={i}>
                        <td className="font-mono">{formatDate(lh.login_time)}</td>
                        <td><strong>{lh.full_name || 'System Admin'}</strong></td>
                        <td>{lh.username}</td>
                        <td>
                          <span className={`badge ${lh.role === 'ADMIN' ? 'badge-red' : 'badge-blue'}`}>
                            {lh.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {loginHistory.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-row">No login logs recorded in history.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="tab-pane activity-pane fade-up">
            <div className="glass-card">
              <div className="card-header-row">
                <h3><i className="fa-solid fa-list-check text-accent"></i> Real-time Operations Audit Trail</h3>
                <span className="live-badge-glow">
                  <span className="pulse-dot"></span> POLLING AUTO-REFRESH (5s)
                </span>
              </div>

              <div className="audit-feed">
                {activities.map(act => (
                  <div key={act.id} className="audit-item glass-card">
                    <div className="audit-meta">
                      <span className={`audit-badge badge-${act.action.toLowerCase()}`}>
                        {act.action}
                      </span>
                      <span className="audit-time"><i className="fa-regular fa-clock"></i> {formatDate(act.timestamp)}</span>
                    </div>
                    <div className="audit-body">
                      <strong>User: {act.username}</strong> — {act.details}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="empty-feed">No actions recorded on this system yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- CUSTOM DELETE MODAL --- */}
      {deleteConfirm.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass-card">
            <div className="modal-header">
              <i className="fa-solid fa-triangle-exclamation modal-warn-icon"></i>
              <h3>Confirm Destructive Action</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete the student account for <strong>{deleteConfirm.studentName}</strong>?</p>
              <p className="danger-text">This will delete all their saved academic criteria, test scores, skill matrices, and AI predictions. This action is irreversible.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setDeleteConfirm({ open: false, studentId: null, studentName: '' })} 
                className="btn btn-outline btn-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="btn btn-primary btn-sm btn-delete-confirm"
                disabled={deleting}
              >
                {deleting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Deleting...</>
                ) : (
                  'Permanently Delete Student'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STUDENT FULL DETAILS MODAL --- */}
      {selectedStudent && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass-card student-detail-modal">
            <div className="modal-header">
              <i className="fa-solid fa-id-card text-accent"></i>
              <h3>Student Registration &amp; Profile Details</h3>
            </div>
            <div className="modal-body student-detail-body">
              <div className="detail-section">
                <h4><i className="fa-solid fa-user"></i> Account &amp; Identity</h4>
                <div className="detail-grid">
                  <div><span className="lbl">Full Name:</span> <strong>{selectedStudent.full_name || 'Not Provided'}</strong></div>
                  <div><span className="lbl">Email / Username:</span> <strong>{selectedStudent.username}</strong></div>
                  <div><span className="lbl">Mobile Number:</span> <strong>{selectedStudent.mobile || 'Not Provided'}</strong></div>
                  <div><span className="lbl">Password:</span> <code>{selectedStudent.plain_password || 'Encrypted'}</code></div>
                  <div><span className="lbl">Registered On:</span> {formatDate(selectedStudent.created_at)}</div>
                  <div><span className="lbl">Last Active:</span> {formatDate(selectedStudent.last_login)}</div>
                  <div><span className="lbl">Login Count:</span> {selectedStudent.login_count} sessions</div>
                </div>
              </div>

              {selectedStudent.has_profile ? (
                <div className="detail-section">
                  <h4><i className="fa-solid fa-graduation-cap"></i> Academic &amp; Aptitude Profile</h4>
                  <div className="detail-grid">
                    <div><span className="lbl">CGPA:</span> <strong>{selectedStudent.cgpa}</strong></div>
                    <div><span className="lbl">Projects:</span> <strong>{selectedStudent.projects}</strong></div>
                    <div><span className="lbl">Certifications:</span> <strong>{selectedStudent.certifications}</strong></div>
                    <div><span className="lbl">Analytical Aptitude:</span> <strong>{selectedStudent.apt_analytical !== null ? `${selectedStudent.apt_analytical}%` : '—'}</strong></div>
                    <div><span className="lbl">Coding Aptitude:</span> <strong>{selectedStudent.apt_coding !== null ? `${selectedStudent.apt_coding}%` : '—'}</strong></div>
                    <div><span className="lbl">Communication:</span> <strong>{selectedStudent.apt_communication !== null ? `${selectedStudent.apt_communication}%` : '—'}</strong></div>
                    <div><span className="lbl">Problem Solving:</span> <strong>{selectedStudent.apt_problem_solving !== null ? `${selectedStudent.apt_problem_solving}%` : '—'}</strong></div>
                  </div>

                  {selectedStudent.skills && (
                    <div className="detail-tags-group">
                      <span className="lbl">Skills:</span>
                      <div className="chips-row">
                        {selectedStudent.skills.split(',').map((sk, idx) => (
                          <span key={idx} className="chip-badge chip-blue">{sk.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStudent.interests && (
                    <div className="detail-tags-group">
                      <span className="lbl">Interests:</span>
                      <div className="chips-row">
                        {selectedStudent.interests.split(',').map((it, idx) => (
                          <span key={idx} className="chip-badge chip-purple">{it.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pending-profile-notice">
                  <i className="fa-solid fa-circle-info"></i> This student has registered but has not yet submitted their academic career assessment profile.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedStudent(null)} className="btn btn-primary btn-sm">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
