import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import centauriMark from '../assets/centauri-mark.svg'
import { apiRequest } from '../api/client'

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1">
      <div className="w-11 h-11 rounded-full bg-vault-surface/10 flex items-center justify-center text-vault-accent">
        <span className="font-sans text-lg">{icon}</span>
      </div>
      <span className="font-sans text-xs text-vault-muted">{label}</span>
    </button>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3.5">
      <span className="font-sans text-sm text-vault-muted">{label}</span>
      <span className="font-sans text-sm text-vault-surface">{value}</span>
    </div>
  )
}

function Profile() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    apiRequest('/auth/me', { token })
      .then(setUser)
      .catch((err) => setError(err.message))
  }, [navigate])

  function handleLogout() {
    const token = localStorage.getItem('token')
    apiRequest('/auth/logout', { method: 'POST', token }).finally(() => {
      localStorage.removeItem('token')
      navigate('/login')
    })
  }

  if (error) {
    return <div className="min-h-screen bg-vault-bg text-vault-danger p-8">{error}</div>
  }

  if (!user) {
    return <div className="min-h-screen bg-vault-bg text-vault-surface p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-vault-bg p-8">
      <div className="max-w-sm mx-auto">
        

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-vault-accent/20 flex items-center justify-center mb-3">
            <span className="font-serif text-2xl text-vault-accent">{getInitials(user.name)}</span>
          </div>
          <h1 className="font-sans text-lg font-semibold text-vault-surface">{user.name}</h1>
          <p className="font-sans text-xs text-vault-muted mt-0.5">{user.wallet.accountTier} account</p>
        </div>

        <div className="flex justify-between mb-10 px-2">
          <QuickAction icon="↩" label="Overview" onClick={() => navigate('/dashboard')} />
          <QuickAction icon="↑" label="Send" onClick={() => navigate('/send')} />
          <QuickAction icon="≡" label="History" onClick={() => navigate('/transactions')} />
          <QuickAction icon="⎋" label="Log out" onClick={handleLogout} />
        </div>

        <p className="font-sans text-xs uppercase tracking-wider text-vault-muted mb-1">Personal details</p>
        <div className="divide-y divide-vault-accent/10">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Account number" value={user.wallet.accountNumber} />
          <InfoRow label="Member since" value={new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })} />
        </div>
      </div>
    </div>
  )
}

export default Profile