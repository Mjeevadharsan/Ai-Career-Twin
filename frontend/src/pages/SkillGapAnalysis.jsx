import { useEffect, useState } from 'react'
import { getProfile } from '../services/profileService'
import SkillGapCard from '../components/SkillGapCard'
import './PageShared.css'

const REQUIRED = {
  'AI Engineer':           ['Python','SQL','Machine_Learning','Deep_Learning'],
  'Data Scientist':        ['Python','SQL','Machine_Learning'],
  'Software Developer':    ['Java','JavaScript','HTML_CSS','C++'],
  'Cybersecurity Analyst': ['Networking','Linux','SQL'],
  'Cloud Engineer':        ['Cloud_Computing','Linux','Networking','SQL'],
  'UI/UX Designer':        ['UI_UX_Design','HTML_CSS','JavaScript'],
}

export default function SkillGapAnalysis() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader"><i className="fa-solid fa-spinner fa-spin fa-2x" style={{color:'var(--blue-400)'}}/></div>

  const userSkills = Array.isArray(data?.skills) ? data.skills : (typeof data?.skills === 'string' ? data.skills.split(',') : [])
  const missing    = data?.analysis?.missing_skills || []
  const top        = data?.analysis?.predictions?.[0]?.career || ''
  const required   = REQUIRED[top] || []

  return (
    <div className="shared-page">
      <div className="page-header">
        <h1><i className="fa-solid fa-road text-accent"/> Skill Gap Analysis</h1>
        <p>Required vs acquired skills for your top career match: <strong>{top}</strong></p>
      </div>

      <div className="two-col-grid">
        <div className="glass-card">
          <h3>Skill Matrix</h3>
          <div className="skill-matrix-full">
            {required.map(sk => (
              <SkillGapCard key={sk} skill={sk} acquired={userSkills.includes(sk)}/>
            ))}
          </div>
          <div className="gap-legend">
            <span className="leg-item leg-acquired"><i className="fa-solid fa-circle-check"/> Acquired</span>
            <span className="leg-item leg-missing"><i className="fa-solid fa-circle-xmark"/> Missing</span>
          </div>
        </div>

        <div className="glass-card">
          <h3>Improvement Suggestions</h3>
          {missing.length === 0
            ? <p className="text-success" style={{fontSize:'0.9rem'}}><i className="fa-solid fa-circle-check"/> No critical skill gaps detected!</p>
            : missing.map((sk, i) => (
                <div key={i} className="suggestion-item">
                  <div className="sug-icon"><i className="fa-solid fa-circle-arrow-right"/></div>
                  <div>
                    <p className="sug-skill">{sk.replace(/_/g,' ')}</p>
                    <p className="sug-desc">Add this skill to improve your {top} match score.</p>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
