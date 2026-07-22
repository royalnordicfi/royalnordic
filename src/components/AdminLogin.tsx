import React, { useState } from 'react'
import { signInAdmin } from '../lib/adminAuth'

type AdminLoginProps = {
  onSuccess: () => void
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInAdmin(email, password)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-emerald-500/30 bg-gray-950 p-8">
        <p className="text-emerald-500/80 text-xs tracking-[0.2em] uppercase mb-3 font-clean">
          Operator console
        </p>
        <h1 className="text-2xl font-luxury font-bold text-emerald-400 tracking-wide mb-2">
          Royal Nordic Admin
        </h1>
        <p className="text-gray-400 text-sm mb-8 font-clean">
          Sign in to manage bookings and availability.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-sm text-gray-300 mb-2 font-clean">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm text-gray-300 mb-2 font-clean">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div
              className="border border-red-500/40 bg-red-950/40 text-red-200 text-sm px-3 py-2"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-elegant font-semibold py-3 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
