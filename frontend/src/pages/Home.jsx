import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const features = [
  { icon: 'fa-circle-nodes',  color: '#3b82f6', title: 'Digital Twin Profiling',  desc: 'Build a virtual clone of your academic strengths, skills, and interests.' },
  { icon: 'fa-microchip',     color: '#8b5cf6', title: 'ML Career Prediction',    desc: 'KNN algorithm predicts your best-fit career with confidence scores.' },
  { icon: 'fa-road',          color: '#10b981', title: 'Skill Gap Analysis',       desc: 'See exactly which skills you need for your target career.' },
  { icon: 'fa-graduation-cap',color: '#f59e0b', title: 'Personalized Roadmaps',   desc: 'Get courses, projects, and certifications tailored to your goals.' },
]

export default function Home() {
  const { user } = useAuth()

  // Quick Demo State
  const [selectedSkill, setSelectedSkill] = useState('Python')
  const [demoResult, setDemoResult] = useState({ career: 'AI Engineer', score: 94 })

  const handleQuickDemo = (skill) => {
    setSelectedSkill(skill)
    const map = {
      Python: { career: 'AI Engineer', score: 94 },
      Java: { career: 'Software Developer', score: 90 },
      SQL: { career: 'Data Scientist', score: 88 },
      Linux: { career: 'Cloud Engineer', score: 91 },
      Networking: { career: 'Cybersecurity Analyst', score: 87 },
      UI_UX_Design: { career: 'UI/UX Designer', score: 95 },
    }
    setDemoResult(map[skill] || { career: 'Software Developer', score: 85 })
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-overlay" />
        
        <div className="hero-centered-content fade-up">
          <div className="badge-pill">
            <i className="fa-solid fa-sparkles" /> Powered by Machine Learning & KNN
          </div>
          
          <h1 className="banner-title">
            AI Career Twin
            <span className="gradient-highlight">Intelligent Career Prediction</span>
            <span className="banner-sub">& Guidance System</span>
          </h1>

          <p className="banner-desc">
            Create a personalized digital twin of your academic profile, skills, and interests.
            Our AI engine identifies your best-fit career paths, highlights skill gaps, and delivers
            tailored roadmaps with recommended courses, projects, and certifications.
          </p>

          <div className="banner-btns">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-gauge" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg">
                  <i className="fa-solid fa-arrow-right-to-bracket" /> Login
                </Link>
                <Link to="/signup" className="btn btn-outline btn-lg">
                  <i className="fa-solid fa-user-plus" /> Sign Up Free
                </Link>
              </>
            )}
          </div>

          <div className="banner-stats">
            <div className="stat-box">
              <span className="stat-val">6+</span>
              <span className="stat-lbl">Career Tracks</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-box">
              <span className="stat-val">1200</span>
              <span className="stat-lbl">Training Samples</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-box">
              <span className="stat-val">KNN</span>
              <span className="stat-lbl">ML Algorithm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Prediction Section */}
      <section className="demo-section fade-up">
        <div className="demo-card glass-card">
          <div className="badge-pill sm">
            <i className="fa-solid fa-wand-magic-sparkles" /> Interactive Demo
          </div>
          <h2>Try a Quick AI Career Prediction</h2>
          <p className="demo-sub">Select your primary technical skill to preview instant KNN match results:</p>

          <div className="skill-selector">
            {['Python', 'Java', 'SQL', 'Linux', 'Networking', 'UI_UX_Design'].map(s => (
              <button
                key={s}
                className={`skill-btn ${selectedSkill === s ? 'active' : ''}`}
                onClick={() => handleQuickDemo(s)}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="demo-result-box">
            <div className="res-info">
              <span className="res-lbl">Predicted Match:</span>
              <h3 className="res-career">{demoResult.career}</h3>
            </div>
            <div className="res-score">
              <span className="score-val">{demoResult.score}%</span>
              <span className="score-lbl">Confidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features fade-up">
        {features.map((f, i) => (
          <div className="feat-card" key={i}>
            <div className="feat-icon" style={{ background: `${f.color}18`, color: f.color }}>
              <i className={`fa-solid ${f.icon}`} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="cta fade-up">
        <div className="cta-card">
          <h2>Ready to discover your ideal career?</h2>
          <p>Join students using AI to navigate their future path.</p>
          <div className="cta-btns">
            <Link to="/signup" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-user-plus" /> Create Free Account
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              <i className="fa-solid fa-arrow-right-to-bracket" /> Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

