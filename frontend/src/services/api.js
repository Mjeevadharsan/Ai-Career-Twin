import axios from 'axios'

// Determine backend root (strip trailing /api if present, then append it cleanly)
const BACKEND_ROOT = (
  import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://ai-career-twin.onrender.com')
).replace(/\/api\/?$/, '').replace(/\/$/, '')

const BASE_URL = `${BACKEND_ROOT}/api`

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,           // No cookies — use header token instead
  headers: { 'Content-Type': 'application/json' }
})

// Attach auth token from localStorage to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers['X-Auth-Token'] = token
  }
  return config
})

export default api
