import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import centauriMark from '../assets/centauri-mark.svg'
import { apiRequest } from '../api/client'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      localStorage.setItem('token', data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={centauriMark} alt="Centauri Bank" className="w-14 h-14 mb-4" />
          <h1 className="font-serif text-3xl font-bold text-vault-surface tracking-wide">
            Centauri Bank
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-vault-surface border border-vault-accent/30 rounded-sm p-8"
        >
          {error && (
            <p className="text-vault-danger text-sm font-sans mb-4">{error}</p>
          )}

          <label className="block font-sans text-xs uppercase tracking-wider text-vault-muted mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-vault-muted/40 rounded-sm px-3 py-2 mb-5 bg-transparent text-vault-bg focus:outline-none focus:border-vault-accent transition-colors"
          />

          <label className="block font-sans text-xs uppercase tracking-wider text-vault-muted mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-vault-muted/40 rounded-sm px-3 py-2 mb-7 bg-transparent text-vault-bg focus:outline-none focus:border-vault-accent transition-colors"
          />

          <button
            type="submit"
            className="w-full bg-vault-primary hover:bg-vault-primary/90 text-white font-sans font-semibold py-2.5 rounded-sm transition-colors"
          >
            Log in
          </button>
        </form>

        <p className="text-center font-sans text-sm text-vault-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-vault-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login