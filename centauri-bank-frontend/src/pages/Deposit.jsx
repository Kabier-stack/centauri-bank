import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { apiRequest } from '../api/client'

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000]

function Deposit() {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  if (!token) {
    navigate('/login')
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const data = await apiRequest('/wallet/deposit', {
        method: 'POST',
        body: { amount: Number(amount) },
        token,
      })
      setSuccess(`Your new balance is ₦${Number(data.wallet.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`)
      setAmount('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-vault-bg flex justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/dashboard" className="font-sans text-sm text-vault-muted mb-6 inline-block hover:text-vault-surface">
          ← Back
        </Link>

        <div className="flex items-center gap-2 mb-2">
          
        </div>
        <h1 className="font-serif text-2xl font-bold text-vault-surface mb-1">Fund Account</h1>
        <p className="font-sans text-sm text-vault-muted mb-8">
          Top up your Centauri account in seconds.
        </p>

        {error && <p className="text-vault-danger text-sm font-sans mb-4">{error}</p>}
        {success && (
          <p className="text-vault-primary text-sm font-sans mb-4 bg-vault-primary/10 border border-vault-primary/30 rounded-2xl px-4 py-3">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-vault-surface rounded-3xl p-6 mb-6">
            <label className="block font-sans text-xs uppercase tracking-wider text-vault-muted mb-3">
              How much would you like to deposit?
            </label>

            <div className="flex items-center gap-1 mb-5">
              <span className="font-serif text-3xl font-bold text-vault-bg">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent font-serif text-3xl font-bold text-vault-bg focus:outline-none placeholder:text-vault-muted/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="bg-vault-bg/5 hover:bg-vault-accent/20 border border-vault-accent/30 text-vault-bg font-sans text-sm px-4 py-2 rounded-full transition-colors"
                >
                  ₦{preset.toLocaleString('en-NG')}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-vault-primary text-white font-sans font-semibold py-3.5 rounded-full"
          >
            Add money
          </button>
        </form>
      </div>
    </div>
  )
}

export default Deposit