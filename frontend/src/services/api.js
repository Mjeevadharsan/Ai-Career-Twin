import axios from 'axios'

// Backend routes are at root level (no /api prefix).
// Dev: hit localhost:5000 directly. Prod: use VITE_API_URL or the Render backend URL.
const BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://ai-career-twin.onrender.com')

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

export default api
