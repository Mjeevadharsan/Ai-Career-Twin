import { useEffect, useState } from 'react'
import { getProfile } from '../services/profileService'
import CourseCard   from '../components/CourseCard'
import ProjectCard  from '../components/ProjectCard'
import './PageShared.css'

const CAREER_COURSES = {
  'AI Engineer':           ['Machine Learning Fundamentals','Deep Learning Specialization','NLP with Python','Computer Vision Basics','Generative AI & LLMs'],
  'Data Scientist':        ['Data Analysis with Python','Statistics for Data Science','SQL for Data Analytics','Power BI / Tableau','Advanced Machine Learning'],
  'Software Developer':    ['Java Full Stack Development','Data Structures & Algorithms','Spring Boot Framework','Web Development (HTML, CSS, JS)','Software Testing'],
  'Cybersecurity Analyst': ['Ethical Hacking','Network Security','Cybersecurity Fundamentals','Penetration Testing','Security Operations Center (SOC)'],
  'Cloud Engineer':        ['AWS Cloud Practitioner','Azure Fundamentals','DevOps & CI/CD','Docker & Kubernetes','Linux Administration'],
  'UI/UX Designer':        ['UI Design Fundamentals','Figma Masterclass','User Research Methods','Responsive Web Design','Interaction Design'],
}

export default function Recommendations() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader"><i className="fa-solid fa-spinner fa-spin fa-2x" style={{color:'var(--blue-400)'}}/></div>

  const top     = data?.analysis?.predictions?.[0]?.career || ''
  const courses  = CAREER_COURSES[top] || data?.analysis?.courses || []
  const projects = data?.analysis?.projects || []
  const certs    = data?.analysis?.certifications || []

  return (
    <div className="shared-page">
      <div className="page-header">
        <h1><i className="fa-solid fa-graduation-cap text-accent"/> Recommendations</h1>
        <p>Personalized courses, projects, and certifications for <strong>{top}</strong></p>
      </div>

      <div className="recs-grid">
        <div className="glass-card">
          <h3><i className="fa-solid fa-book-open text-accent"/> Recommended Courses</h3>
          <div className="rec-list-full">
            {courses.map((c, i) => <CourseCard key={i} title={c} category={top} index={i}/>)}
          </div>
        </div>

        <div className="glass-card">
          <h3><i className="fa-solid fa-laptop-code text-accent"/> Suggested Projects</h3>
          <div className="rec-list-full">
            {projects.map((p, i) => <ProjectCard key={i} title={p} index={i}/>)}
          </div>
        </div>

        <div className="glass-card recs-certs">
          <h3><i className="fa-solid fa-certificate text-accent"/> Certifications</h3>
          <div className="certs-grid">
            {certs.map((c, i) => (
              <div key={i} className="cert-item">
                <i className="fa-solid fa-award" style={{color:'var(--warning)'}}/>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
