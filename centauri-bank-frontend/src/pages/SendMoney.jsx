import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function SendMoney() {
  const [user, setUser] = useState(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [recipientInfo, setRecipientInfo] = useState(null)
  const [amount, setAmount] = useState('')
  const [expressTransfer, setExpressTransfer] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    apiRequest('/auth/me', { token }).then(setUser).catch(() => navigate('/login'))
  }, [navigate, token])

  function handleAccountNumberChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    setAccountNumber(digitsOnly.slice(0, 10))
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setRecipientInfo(null)

    try {
      const data = await apiRequest(`/wallet/verify-recipient?accountNumber=${accountNumber}`, { token })
      setRecipientInfo(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleTransfer(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const body = { recipientAccountNumber: accountNumber, amount: Number(amount) }
      if (expressTransfer) body.expressTransfer = true

      const data = await apiRequest('/wallet/transfer', { method: 'POST', body, token })
      setSuccess(`Sent successfully. Reference: ${data.reference}`)
      setAmount('')
    } catch (err) {
      setError(err.message)
    }
  }

  function resetRecipient() {
    setRecipientInfo(null)
    setAccountNumber('')
    setAmount('')
  }

  if (!user) {
    return <div className="min-h-screen bg-vault-bg text-vault-surface p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-vault-bg flex justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          
          <span className="font-serif text-lg text-vault-surface tracking-wide">Send money</span>
        </div>

        {error && <p className="text-vault-danger text-sm font-sans mb-4 text-center">{error}</p>}
        {success && <p className="text-vault-primary text-sm font-sans mb-4 text-center">{success}</p>}

        {!recipientInfo && (
          <form onSubmit={handleVerify}>
            <label className="block font-sans text-xs uppercase tracking-wider text-vault-muted mb-2 text-center">
              Enter recipient's account number
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="0000000000"
              className="w-full text-center font-sans text-lg tracking-widest border border-vault-muted/40 rounded-full px-4 py-3 mb-4 bg-transparent text-vault-surface focus:outline-none focus:border-vault-accent"
            />
            <button
              type="submit"
              className="w-full bg-vault-primary text-white font-sans font-semibold py-3 rounded-full"
            >
              Find recipient
            </button>
          </form>
        )}

        {recipientInfo && !success && (
          <div>
            <button
              onClick={resetRecipient}
              className="font-sans text-sm text-vault-muted mb-6 hover:text-vault-surface"
            >
              ← Change recipient
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-vault-accent/20 border border-vault-accent flex items-center justify-center mb-3">
                <span className="font-serif text-xl text-vault-accent">
                  {getInitials(recipientInfo.accountHolderName)}
                </span>
              </div>
              <p className="font-sans text-vault-surface font-medium">{recipientInfo.accountHolderName}</p>
              <p className="font-sans text-xs text-vault-muted uppercase tracking-wider mt-1">
                {recipientInfo.accountTier} · {recipientInfo.accountNumber}
              </p>
            </div>

            <form onSubmit={handleTransfer}>
              <div className="text-center mb-8">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center bg-transparent font-serif text-5xl font-bold text-vault-surface focus:outline-none placeholder:text-vault-muted/40"
                />
                <p className="font-sans text-xs text-vault-muted uppercase tracking-wider mt-2"><b>₦</b></p>
              </div>

              {user.wallet.accountTier === 'PREMIUM' && (
                <label className="flex items-center justify-center gap-2 font-sans text-sm text-vault-muted mb-6">
                  <input
                    type="checkbox"
                    checked={expressTransfer}
                    onChange={(e) => setExpressTransfer(e.target.checked)}
                  />
                  Use Express Transfer (instant, no fee)
                </label>
              )}

              <button
                type="submit"
                className="w-full bg-vault-primary text-white font-sans font-semibold py-3 rounded-full"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default SendMoney