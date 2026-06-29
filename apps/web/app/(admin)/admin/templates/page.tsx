'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, X, Cpu } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

type Template = {
  id: string
  name: string
  templateKey: string
  isPremium: boolean
  isActive: boolean
}

async function getToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [aiProvider, setAiProvider] = useState<'claude' | 'gemini'>('claude')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [aiSaving, setAiSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const token = await getToken()
      const [tRes, sRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/templates`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (tRes.ok) setTemplates(await tRes.json())
      if (sRes.ok) {
        const s = await sRes.json()
        setAiProvider(s.ai_provider ?? 'claude')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function toggleTemplate(id: string, field: 'isActive' | 'isPremium', current: boolean) {
    setSaving(id + field)
    const token = await getToken()
    await fetch(`${API_URL}/api/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    })
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: !current } : t))
    setSaving(null)
  }

  async function switchAiProvider(p: 'claude' | 'gemini') {
    setAiSaving(true)
    const token = await getToken()
    await fetch(`${API_URL}/api/admin/settings/ai_provider`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: p }),
    })
    setAiProvider(p)
    setAiSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-neutral-400">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif mb-6">Templates &amp; IA</h1>

        {/* Switch IA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-neutral-400" />
            <h2 className="font-semibold">Fournisseur IA actif</h2>
            {aiSaving && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          </div>
          <div className="flex gap-3">
            {(['claude', 'gemini'] as const).map(p => (
              <button
                key={p}
                onClick={() => switchAiProvider(p)}
                disabled={aiSaving}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition capitalize ${
                  aiProvider === p
                    ? 'bg-white text-black'
                    : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                }`}
              >
                {p === 'claude' ? 'Claude (Anthropic)' : 'Gemini (Google)'}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Appliqué immédiatement à toutes les nouvelles générations de CV.
          </p>
        </div>

        {/* Templates table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="text-left px-4 py-3 font-medium">Template</th>
                <th className="text-left px-4 py-3 font-medium">Clé</th>
                <th className="text-center px-4 py-3 font-medium">Actif</th>
                <th className="text-center px-4 py-3 font-medium">Premium</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{t.templateKey}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleTemplate(t.id, 'isActive', t.isActive)}
                      disabled={saving === t.id + 'isActive'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${
                        t.isActive ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-neutral-800 text-neutral-500 hover:bg-green-500/20 hover:text-green-400'
                      }`}
                    >
                      {saving === t.id + 'isActive'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : t.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleTemplate(t.id, 'isPremium', t.isPremium)}
                      disabled={saving === t.id + 'isPremium'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${
                        t.isPremium ? 'bg-amber-500/20 text-amber-400 hover:bg-neutral-800 hover:text-neutral-400' : 'bg-neutral-800 text-neutral-500 hover:bg-amber-500/20 hover:text-amber-400'
                      }`}
                    >
                      {saving === t.id + 'isPremium'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : t.isPremium ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
