'use client'

import { useState } from 'react'
import { initPayment } from '@/lib/api'

export default function PayButton({ cvId }: { cvId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const { paymentUrl } = await initPayment(cvId)
      window.location.href = paymentUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full border border-white text-white font-semibold py-3 rounded-xl hover:bg-white hover:text-black transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirection...' : 'Débloquer — 2 000 FCFA'}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
