import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminPanel from './components/AdminPanel'

/**
 * Operator console — only mounted when hostname is admin.royalnordic.fi
 * (or local ?admin=1 override).
 */
function AdminApp() {
  useEffect(() => {
    document.title = 'Royal Nordic Admin'
    const robots = document.querySelector('meta[name="robots"]')
    if (robots) {
      robots.setAttribute('content', 'noindex, nofollow')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    }
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default AdminApp
