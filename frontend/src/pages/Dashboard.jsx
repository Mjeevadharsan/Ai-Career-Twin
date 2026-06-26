import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile } from '../services/profileService'
import CareerCard   from '../components/CareerCard'
import SkillGapCard from '../components/SkillGapCard'
import CourseCard   from '../components/CourseCard'
import ProjectCard  from '../components/ProjectCard'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

const REQUIRED_SKILLS = {
  'AI Engineer':           ['Python','SQL','Machine_Learning','Deep_Learning'],
  'Data Scientist':        ['Python','SQL','Machine_Learning'],
  'Software Developer':    ['Java','JavaScript','HTML_CSS','C++'],
  'Cybersecurity Analyst': ['Networking','Linux','SQL'],
  'Cloud Engineer':        ['Cloud_Computing','Linux','Networking','SQL'],
  'UI/UX Designer':        ['UI_UX_Design','HTML_CSS','JavaScript'],
}

export default function Dashboard() {
  const { user }       = useAuth()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="dash-loader">
      <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color:'var(--blue-400)' }}/>
      <p>Loading your Career Twin…</p>
    </div>
  )

  if (!data?.has_profile) return (
    <div className="dash-empty">
      <div className="empty-card glass-card">
        <i className="fa-solid fa-circle-nodes fa-3x" style={{ color:'var(--blue-400)', marginBottom:16 }}/>
        <h2>No Profile Yet</h2>
        <p>Complete your assessment to generate your AI Career Twin.</p>
        <Link to="/profile" className="btn btn-primary" style={{ marginTop:20 }}>
          <i className="fa-solid fa-user-pen"/> Build My Twin
        </Link>
      </div>
    </div>
  )

  const analysis = data.analysis
  const top      = analysis.predictions[0]
  const dims     = analysis.twinDimensions
  const radarData = Object.entries(dims).map(([subject, value]) => ({ subject, value }))
  const requiredSkills = REQUIRED_SKILLS[top.career] || []
  const userSkills     = Array.isArray(data.skills) ? data.skills : [...(data.skills || [])]

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, <span className="gradient-text">{user?.fullName || user?.username}</span></h1>
          <p className="dash-sub">Here's your AI Career Twin analysis — CGPA: {parseFloat(data.cgpa).toFixed(2)}</p>
        </div>
        <Link to="/profile" className="btn btn-outline">
          <i className="fa-solid fa-user-pen"/> Update Profile
        </Link>
      </div>

      {/* Quick stats */}
      <div className="dash-stats">
        {[
          { label:'CGPA', value: parseFloat(data.cgpa).toFixed(1), icon:'fa-star', color:'#3b82f6' },
          { label:'Projects', value: data.projects, icon:'fa-laptop-code', color:'#10b981' },
          { label:'Certifications', value: data.certifications, icon:'fa-certificate', color:'#8b5cf6' },
          { label:'Top Match', value: `${Math.round(top.probability*100)}%`, icon:'fa-bullseye', color:'#f59e0b' },
        ].map((s,i) => (
          <div key={i} className="stat-card glass-card">
            <div className="stat-icon" style={{ background:`${s.color}18`, color:s.color }}>
              <i className={`fa-solid ${s.icon}`}/>
            </div>
            <div>
              <div className="stat-val">{s.value}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Radar Twin */}
        <div className="glass-card dash-radar">
          <h3><i className="fa-solid fa-chart-radar text-accent"/> Capability Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)"/>
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#94a3b8', fontSize:11 }}/>
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
          <div className="vector-lists">
            <div>
              <p className="vl-label text-success"><i className="fa-solid fa-circle-check"/> Strengths</p>
              {analysis.strengths.map((s,i) => <p key={i} className="vl-item">{s}</p>)}
            </div>
            <div>
              <p className="vl-label text-warning"><i className="fa-solid fa-triangle-exclamation"/> Growth Areas</p>
              {analysis.weaknesses.map((w,i) => <p key={i} className="vl-item">{w}</p>)}
            </div>
          </div>
        </div>

        {/* Career Predictions */}
        <div className="glass-card dash-predictions">
          <div className="card-head-row">
            <h3><i className="fa-solid fa-microchip text-accent"/> Career Predictions</h3>
            <Link to="/prediction" className="btn btn-outline btn-sm2">View All</Link>
          </div>
          <div className="career-cards-list">
            {analysis.predictions.slice(0,4).map((p,i) => (
              <CareerCard key={i} career={p.career} probability={p.probability} rank={i}/>
            ))}
          </div>
        </div>

        {/* Skill Gap */}
        <div className="glass-card dash-skillgap">
          <div className="card-head-row">
            <h3><i className="fa-solid fa-road text-accent"/> Skill Gap – {top.career}</h3>
            <Link to="/skill-gap" className="btn btn-outline btn-sm2">Details</Link>
          </div>
          <div className="skill-matrix">
            {requiredSkills.map(sk => (
              <SkillGapCard key={sk} skill={sk} acquired={userSkills.includes(sk)}/>
            ))}
          </div>
        </div>

        {/* Courses */}
        <div className="glass-card dash-courses">
          <div className="card-head-row">
            <h3><i className="fa-solid fa-graduation-cap text-accent"/> Recommended Courses</h3>
            <Link to="/recommendations" className="btn btn-outline btn-sm2">All</Link>
          </div>
          <div className="rec-list">
            {analysis.courses.slice(0,4).map((c,i) => (
              <CourseCard key={i} title={c} category={top.career} index={i}/>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="glass-card dash-projects">
          <div className="card-head-row">
            <h3><i className="fa-solid fa-laptop-code text-accent"/> Suggested Projects</h3>
            <Link to="/recommendations" className="btn btn-outline btn-sm2">All</Link>
          </div>
          <div className="rec-list">
            {analysis.projects.slice(0,4).map((p,i) => (
              <ProjectCard key={i} title={p} index={i}/>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="glass-card dash-progress">
          <h3><i className="fa-solid fa-chart-line text-accent"/> Progress Tracker</h3>
          <div className="progress-items">
            {Object.entries(dims).map(([label, val]) => (
              <div key={label} className="prog-row">
                <div className="prog-label-row">
                  <span>{label}</span><span className="prog-pct">{val}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${val}%` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
