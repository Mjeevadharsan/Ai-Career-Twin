import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p>© 2026 <strong>AI Career Twin</strong> — B.E. Computer Science &amp; Engineering, Final Year Project | <a href="https://github.com/Mjeevadharsan" target="_blank" rel="noopener noreferrer" className="github-link"><i className="fa-brands fa-github" /> Mjeevadharsan</a></p>
        <p className="footer-tags">
          Artificial Intelligence &bull; Machine Learning &bull; Career Guidance &bull; Recommendation System &bull; Data Analytics
        </p>
        <p className="footer-tech">
          <span><i className="fa-solid fa-laptop-code" /> React.js Frontend</span>
          <span>|</span>
          <span><i className="fa-solid fa-leaf" /> Spring Boot API</span>
          <span>|</span>
          <span><i className="fa-solid fa-database" /> SQLite / MySQL</span>
          <span>|</span>
          <span><i className="fa-brands fa-python" /> Python ML</span>
        </p>
      </div>
    </footer>
  )
}
