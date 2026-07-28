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
  return (
    <div className="home-page">
      {/* BG orbs */}
      <div className="orbs">
        <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
      </div>

      {/* Hero */}
      <section className="hero fade-up">
        <div className="hero-content">
          <span className="hero-badge"><i className="fa-solid fa-sparkles"/> Powered by Machine Learning & KNN</span>
          <h1 className="hero-title">
            AI Career Twin
            <span className="gradient-text">Intelligent Career Prediction</span>
            <span className="hero-sub">& Guidance System</span>
          </h1>
          <p className="hero-desc">
            Create a personalized digital twin of your academic profile, skills, and interests.
            Our AI engine identifies your best-fit career paths, highlights skill gaps, and delivers
            tailored roadmaps with recommended courses, projects, and certifications.
          </p>
          <div className="hero-btns">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-gauge"/> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login"  className="btn btn-primary btn-lg"><i className="fa-solid fa-arrow-right-to-bracket"/> Login</Link>
                <Link to="/signup" className="btn btn-outline btn-lg"><i className="fa-solid fa-user-plus"/> Sign Up Free</Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-n">6+</span><span className="stat-l">Career Tracks</span></div>
            <div className="stat-div"/>
            <div className="stat"><span className="stat-n">1200</span><span className="stat-l">Training Samples</span></div>
            <div className="stat-div"/>
            <div className="stat"><span className="stat-n">KNN</span><span className="stat-l">ML Algorithm</span></div>
          </div>
        </div>

        {/* SVG Illustration */}
        <div className="hero-illo">
          <div className="illo-wrap">
            <svg viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="illo-svg">
              <circle cx="210" cy="185" r="140" stroke="url(#r1)" strokeWidth="1" strokeDasharray="5 8" opacity=".5"/>
              <circle cx="210" cy="185" r="104" stroke="url(#r2)" strokeWidth="1.5" strokeDasharray="3 5" opacity=".4"/>
              <circle cx="210" cy="185" r="58" fill="url(#hub)" filter="url(#glow)"/>
              <line x1="148" y1="108" x2="186" y2="148" stroke="url(#lg)" strokeWidth="1.5"/>
              <circle cx="120" cy="86" r="34" fill="url(#n1)"/>
              <text x="120" y="93" textAnchor="middle" fontSize="20">⚙️</text>
              <line x1="330" y1="100" x2="276" y2="148" stroke="url(#lg)" strokeWidth="1.5"/>
              <circle cx="356" cy="78" r="34" fill="url(#n2)"/>
              <text x="356" y="85" textAnchor="middle" fontSize="20">🎯</text>
              <line x1="108" y1="278" x2="166" y2="232" stroke="url(#lg)" strokeWidth="1.5"/>
              <circle cx="84" cy="300" r="34" fill="url(#n3)"/>
              <text x="84" y="307" textAnchor="middle" fontSize="20">🎓</text>
              <line x1="352" y1="284" x2="278" y2="238" stroke="url(#lg)" strokeWidth="1.5"/>
              <circle cx="376" cy="306" r="34" fill="url(#n4)"/>
              <text x="376" y="313" textAnchor="middle" fontSize="20">📊</text>
              <line x1="210" y1="340" x2="210" y2="243" stroke="url(#lg)" strokeWidth="1.5"/>
              <circle cx="210" cy="362" r="28" fill="url(#n5)"/>
              <text x="210" y="369" textAnchor="middle" fontSize="16">🚀</text>
              <defs>
                <radialGradient id="hub"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#1e40af"/></radialGradient>
                <linearGradient id="r1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient>
                <linearGradient id="r2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" stopOpacity=".7"/><stop offset="100%" stopColor="#a78bfa" stopOpacity=".3"/></linearGradient>
                <radialGradient id="n1"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#1e40af"/></radialGradient>
                <radialGradient id="n2"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#5b21b6"/></radialGradient>
                <radialGradient id="n3"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#065f46"/></radialGradient>
                <radialGradient id="n4"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#92400e"/></radialGradient>
                <radialGradient id="n5"><stop offset="0%" stopColor="#ec4899"/><stop offset="100%" stopColor="#9d174d"/></radialGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features fade-up">
        {features.map((f, i) => (
          <div className="feat-card" key={i}>
            <div className="feat-icon" style={{ background:`${f.color}18`, color:f.color }}>
              <i className={`fa-solid ${f.icon}`}/>
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="cta fade-up">
        <div className="cta-card">
          <h2>Ready to discover your ideal career?</h2>
          <p>Join students using AI to navigate their future path.</p>
          <div className="cta-btns">
            <Link to="/signup" className="btn btn-primary btn-lg"><i className="fa-solid fa-user-plus"/> Create Free Account</Link>
            <Link to="/login"  className="btn btn-outline btn-lg"><i className="fa-solid fa-arrow-right-to-bracket"/> Login</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
