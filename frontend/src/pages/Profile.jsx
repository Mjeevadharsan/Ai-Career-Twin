import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile } from '../services/profileService'
import './Profile.css'

const ALL_SKILLS    = ['Python','Java','SQL','C++','HTML_CSS','JavaScript','Machine_Learning','Deep_Learning','Networking','Linux','Cloud_Computing','UI_UX_Design']
const ALL_INTERESTS = ['Interest_AI','Interest_Web','Interest_Cybersecurity','Interest_DataScience','Interest_Cloud','Interest_UIUX']
const INTEREST_LABELS = { Interest_AI:'AI & ML', Interest_Web:'Web Dev', Interest_Cybersecurity:'Cybersecurity', Interest_DataScience:'Data Science', Interest_Cloud:'Cloud Systems', Interest_UIUX:'UI/UX Design' }

export default function Profile() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]        = useState(null)
  const [form, setForm] = useState({
    cgpa:7.5, projects:2, certifications:1,
    skills:[], interests:[],
    apt_analytical:70, apt_coding:65, apt_communication:75, apt_problem_solving:70,
  })

  useEffect(() => {
    getProfile().then(res => {
      if (res.data?.has_profile) {
        const d = res.data
        setForm({
          cgpa: d.cgpa, projects: d.projects, certifications: d.certifications,
          skills: [...(d.skills||[])], interests: [...(d.interests||[])],
          apt_analytical: d.apt_analytical, apt_coding: d.apt_coding,
          apt_communication: d.apt_communication, apt_problem_solving: d.apt_problem_solving,
        })
      }
    }).catch(() => {})
  }, [])

  const toggle = (key, val) => {
    setForm(f => {
      const arr = f[key]
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  const handleSubmit = async () => {
    setLoading(true); setMsg(null)
    try {
      const res = await saveProfile(form)
      const profileData = {
        ...form,
        has_profile: true,
        ...res.data,
      }
      setMsg({ type:'success', text:'Twin profile updated! Loading your AI career predictions…' })
      setTimeout(() => navigate('/dashboard', { state: { profileData } }), 300)
    } catch { setMsg({ type:'error', text:'Failed to save profile. Please try again.' }) }
    finally   { setLoading(false) }
  }

  return (
    <div className="profile-page">
      <div className="profile-card glass-card fade-up">
        <div className="profile-header">
          <h2>Configure Your Career Twin</h2>
          <p>Provide your academic metrics, skills, and aptitude levels.</p>
          <div className="steps">
            {[1,2,3].map(s => <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`}>{s}</div>)}
          </div>
        </div>

        {msg && <div className={`msg-box ${msg.type}`}>{msg.text}</div>}

        {step === 1 && (
          <div className="step-content fade-up">
            <h3>Step 1: Academic & Project Metrics</h3>
            <div className="form-grid">
              {[
                { label:'Academic CGPA', id:'cgpa', type:'number', min:6, max:10, step:0.01 },
                { label:'Completed Projects', id:'projects', type:'number', min:0, max:15 },
                { label:'Certifications', id:'certifications', type:'number', min:0, max:15 },
              ].map(f => (
                <div key={f.id} className="field">
                  <label>{f.label}</label>
                  <input type={f.type} min={f.min} max={f.max} step={f.step}
                    value={form[f.id]}
                    onChange={e => setForm({...form, [f.id]: parseFloat(e.target.value)||0})}
                    className="plain-input"/>
                </div>
              ))}
            </div>
            <div className="step-actions"><button className="btn btn-primary" onClick={() => setStep(2)}>Next <i className="fa-solid fa-arrow-right"/></button></div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content fade-up">
            <h3>Step 2: Technical Skills</h3>
            <div className="skills-grid">
              {ALL_SKILLS.map(sk => (
                <label key={sk} className={`skill-chip ${form.skills.includes(sk) ? 'checked' : ''}`}>
                  <input type="checkbox" checked={form.skills.includes(sk)} onChange={() => toggle('skills', sk)}/>
                  {sk.replace(/_/g,' ')}
                </label>
              ))}
            </div>
            <div className="step-actions">
              <button className="btn btn-outline" onClick={() => setStep(1)}><i className="fa-solid fa-arrow-left"/> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next <i className="fa-solid fa-arrow-right"/></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content fade-up">
            <h3>Step 3: Aptitude &amp; Interests</h3>
            <div className="interests-grid">
              {ALL_INTERESTS.map(int => (
                <label key={int} className={`interest-chip ${form.interests.includes(int) ? 'checked' : ''}`}>
                  <input type="checkbox" checked={form.interests.includes(int)} onChange={() => toggle('interests', int)}/>
                  {INTEREST_LABELS[int]}
                </label>
              ))}
            </div>
            <div className="sliders-grid">
              {[
                { key:'apt_analytical',     label:'Analytical Aptitude' },
                { key:'apt_coding',         label:'Coding Proficiency' },
                { key:'apt_communication',  label:'Communication' },
                { key:'apt_problem_solving',label:'Problem Solving' },
              ].map(s => (
                <div key={s.key} className="slider-wrap">
                  <div className="slider-head"><label>{s.label}</label><span className="slider-val">{form[s.key]}%</span></div>
                  <input type="range" min={30} max={100} value={form[s.key]}
                    onChange={e => setForm({...form, [s.key]: +e.target.value})}/>
                </div>
              ))}
            </div>
            <div className="step-actions">
              <button className="btn btn-outline" onClick={() => setStep(2)}><i className="fa-solid fa-arrow-left"/> Back</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin"/> Saving…</> : <><i className="fa-solid fa-circle-nodes"/> Generate Twin</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
