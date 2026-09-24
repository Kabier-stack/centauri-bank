import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import centauriMark from '../assets/centauri-mark.svg'
import { apiRequest } from '../api/client'

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatMemberSince(isoString) {
  return new Date(isoString).toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  })
}

function Dashboard() {
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

  if (error) {
    return <div className="min-h-screen bg-vault-bg text-vault-danger p-8">{error}</div>
  }

  if (!user) {
    return <div className="min-h-screen bg-vault-bg text-vault-surface p-8">Loading...</div>
  }

  const maskedAccount = `${user.wallet.accountNumber.slice(0, 4)} •••• ${user.wallet.accountNumber.slice(-2)}`

  return (
    <div className="min-h-screen bg-vault-bg flex">
      <aside className="w-56 border-r border-vault-accent/20 flex flex-col py-6 px-4">
        <div className="flex items-center gap-2 mb-10 px-2">
          <img src={centauriMark} alt="Centauri Bank" className="w-8 h-8" />
          <span className="font-serif text-lg text-vault-surface tracking-wide">Centauri</span>
        </div>

        <nav className="flex flex-col gap-1 font-sans text-sm">
          <a href="/dashboard" className="px-3 py-2 rounded-sm bg-vault-surface/10 text-vault-surface">
            Overview
          </a>
          <a href="/send" className="px-3 py-2 rounded-sm text-vault-muted hover:text-vault-surface hover:bg-vault-surface/5">
            Send money
          </a>
          <a href="/transactions" className="px-3 py-2 rounded-sm text-vault-muted hover:text-vault-surface hover:bg-vault-surface/5">
            Transactions
          </a>
          <a href="/profile" className="px-3 py-2 rounded-sm text-vault-muted hover:text-vault-surface hover:bg-vault-surface/5">
            Profile
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-vault-accent/20">
          <div>
            <p className="font-sans text-xs uppercase tracking-wider text-vault-muted">Account</p>
            <p className="font-sans text-sm text-vault-surface">{maskedAccount}</p>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs uppercase tracking-wider text-vault-muted">Signed in as</p>
            <p className="font-sans text-sm text-vault-surface">{user.name}</p>
          </div>
        </header>

        <section className="bg-vault-surface border border-vault-accent/30 rounded-sm p-6 mb-8">
          <p className="font-sans text-xs uppercase tracking-wider text-vault-muted mb-2">Available balance</p>
          <p className="font-serif text-5xl font-bold text-vault-bg tabular-nums">
            {formatNaira(user.wallet.balance)}
          </p>
          <p className="font-sans text-xs text-vault-muted mt-2">{user.wallet.accountTier} tier</p>
        </section>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <a href="/send" className="bg-vault-primary text-white font-sans text-sm font-semibold py-3 rounded-sm text-center">
            Send money
          </a>
          <a href="/deposit" className="border border-vault-accent/40 text-vault-surface font-sans text-sm py-3 rounded-sm text-center">
            Deposit
          </a>
        </div>

        <section className="bg-vault-surface/5 border border-vault-accent/20 rounded-sm p-8 flex items-center gap-8">
          <img src={centauriMark} alt="" className="w-20 h-20 opacity-90 flex-shrink-0" />
          <div>
            <p className="font-serif text-lg text-vault-surface mb-1">Secured by Centauri Vault</p>
            <p className="font-sans text-sm text-vault-muted mb-3 max-w-sm">
              Every transaction is protected by end-to-end authentication and
              real-time monitoring.The same architecture trusted since you
              opened your account.
            </p>
            <p className="font-sans text-xs uppercase tracking-wider text-vault-accent">
              {user.wallet.accountTier} member since {formatMemberSince(user.createdAt)}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard