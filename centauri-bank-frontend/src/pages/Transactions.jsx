import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { apiRequest } from '../api/client'

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function groupByDate(transactions) {
  const groups = {}
  for (const tx of transactions) {
    const date = new Date(tx.createdAt)
    const label = date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    if (!groups[label]) groups[label] = []
    groups[label].push(tx)
  }
  return groups
}

function TransactionIcon({ type }) {
  const isCredit = type === 'DEPOSIT' || type === 'TRANSFER_IN'
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        isCredit ? 'bg-vault-primary/15 text-vault-primary' : 'bg-vault-danger/15 text-vault-danger'
      }`}
    >
      <span className="font-sans text-sm">{isCredit ? '↓' : '↑'}</span>
    </div>
  )
}

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    apiRequest('/wallet/transactions', { token })
      .then((data) => setTransactions(data.transactions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [navigate])

  const filtered = transactions.filter((tx) =>
    tx.description.toLowerCase().includes(filter.toLowerCase())
  )
  const grouped = groupByDate(filtered)

  return (
    <div className="min-h-screen bg-vault-bg p-8">
      <div className="max-w-lg mx-auto">
       
        <h1 className="font-serif text-2xl font-bold text-vault-surface mb-1">Transactions</h1>
        <Link to="/dashboard" className="font-sans text-sm text-vault-accent hover:underline">
          ← Back to overview
        </Link>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search transactions"
          className="w-full mt-6 mb-2 border border-vault-muted/30 rounded-full px-4 py-2 bg-transparent text-vault-surface font-sans text-sm focus:outline-none focus:border-vault-accent placeholder:text-vault-muted/50"
        />

        <div className="mt-6">
          {error && <p className="text-vault-danger text-sm font-sans">{error}</p>}
          {loading && <p className="text-vault-muted text-sm font-sans">Loading...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-vault-muted text-sm font-sans">No transactions found.</p>
          )}

          {Object.entries(grouped).map(([dateLabel, txs]) => (
            <div key={dateLabel} className="mb-6">
              <p className="font-sans text-xs uppercase tracking-wider text-vault-muted mb-3">
                {dateLabel}
              </p>
              <div>
                {txs.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 py-3 border-b border-vault-accent/10"
                    >
                      <TransactionIcon type={tx.type} />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-vault-surface truncate">{tx.description}</p>
                        <p className="font-sans text-xs text-vault-muted">{tx.reference}</p>
                      </div>
                      <p
                        className={`font-sans text-sm tabular-nums flex-shrink-0 ${
                          isCredit ? 'text-vault-primary' : 'text-vault-danger'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatNaira(tx.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Transactions