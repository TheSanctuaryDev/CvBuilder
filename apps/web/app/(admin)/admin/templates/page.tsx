'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, X, Cpu, Plus, Trash2, Pencil, ImageUp } from 'lucide-react'
import { parseTokens, type StyleTokens } from '@/components/templates/registry'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

type Template = {
  id: string
  name: string
  templateKey: string
  isPremium: boolean
  isActive: boolean
  previewUrl: string | null
  styleTokens: string
}

type TokenForm = {
  fontFamily: 'serif' | 'sans-serif'
  nameColor: string
  accentColor: string
  dividerColor: string
  dividerWidth: '1' | '2'
}

const DEFAULT_TOKEN_FORM: TokenForm = {
  fontFamily: 'serif',
  nameColor: '#111111',
  accentColor: '#6b7280',
  dividerColor: '#d1d5db',
  dividerWidth: '1',
}

async function getToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

function tokensFromRaw(raw: string): TokenForm {
  const t = parseTokens(raw)
  return {
    fontFamily: t.fontFamily,
    nameColor: t.nameColor,
    accentColor: t.accentColor,
    dividerColor: t.dividerColor,
    dividerWidth: t.dividerWidth,
  }
}

function ColorDot({ color }: { color: string }) {
  return <span className="inline-block w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ background: color }} />
}

function TokenEditor({ value, onChange }: { value: TokenForm; onChange: (t: TokenForm) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 p-3 bg-neutral-800/50 rounded-lg">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs text-neutral-400 mb-1">Police</label>
        <select
          value={value.fontFamily}
          onChange={e => onChange({ ...value, fontFamily: e.target.value as 'serif' | 'sans-serif' })}
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
        >
          <option value="serif">Serif (Georgia)</option>
          <option value="sans-serif">Sans-serif (Helvetica)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Couleur nom</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={value.nameColor}
            onChange={e => onChange({ ...value, nameColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <input
            type="text"
            value={value.nameColor}
            onChange={e => onChange({ ...value, nameColor: e.target.value })}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Couleur accent</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={value.accentColor}
            onChange={e => onChange({ ...value, accentColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <input
            type="text"
            value={value.accentColor}
            onChange={e => onChange({ ...value, accentColor: e.target.value })}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Couleur séparateur</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={value.dividerColor}
            onChange={e => onChange({ ...value, dividerColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <input
            type="text"
            value={value.dividerColor}
            onChange={e => onChange({ ...value, dividerColor: e.target.value })}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Épaisseur séparateur</label>
        <select
          value={value.dividerWidth}
          onChange={e => onChange({ ...value, dividerWidth: e.target.value as '1' | '2' })}
          className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
        >
          <option value="1">1px (fin)</option>
          <option value="2">2px (épais)</option>
        </select>
      </div>

      {/* Mini aperçu */}
      <div className="col-span-2 sm:col-span-3 bg-white rounded p-2 text-xs mt-1">
        <p className="font-bold" style={{ color: value.nameColor, fontFamily: value.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}>Jean Dupont</p>
        <p style={{ color: value.accentColor, fontFamily: value.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif', fontSize: 10 }}>Développeur · jean@mail.com</p>
        <hr style={{ borderTop: `${value.dividerWidth}px solid ${value.dividerColor}`, margin: '4px 0', border: 'none', borderTopStyle: 'solid' }} />
        <p className="uppercase font-bold" style={{ color: value.accentColor, fontSize: 8, letterSpacing: '0.1em' }}>Expériences</p>
      </div>
    </div>
  )
}

const emptyForm = { name: '', templateKey: '', isPremium: false }
const emptyTokenForm: TokenForm = DEFAULT_TOKEN_FORM

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [aiProvider, setAiProvider] = useState<'claude' | 'gemini'>('claude')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [aiSaving, setAiSaving] = useState(false)

  // Création
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createTokens, setCreateTokens] = useState<TokenForm>(emptyTokenForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Édition inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', templateKey: '' })
  const [editTokens, setEditTokens] = useState<TokenForm>(emptyTokenForm)
  const [editSaving, setEditSaving] = useState(false)

  // Suppression
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Upload image
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUpload, setPendingUpload] = useState<Template | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!createForm.name.trim() || !createForm.templateKey.trim()) {
      setCreateError('Nom et clé sont requis.')
      return
    }
    setCreating(true)
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/admin/templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.name.trim(),
        templateKey: createForm.templateKey.trim().toLowerCase(),
        isPremium: createForm.isPremium,
        styleTokens: JSON.stringify(createTokens),
      }),
    })
    if (res.status === 409) { setCreateError('Cette clé existe déjà.'); setCreating(false); return }
    if (!res.ok) { setCreateError('Erreur lors de la création.'); setCreating(false); return }
    const created: Template = await res.json()
    setTemplates(prev => [...prev, created])
    setCreateForm(emptyForm)
    setCreateTokens(emptyTokenForm)
    setShowCreate(false)
    setCreating(false)
  }

  function startEdit(t: Template) {
    setEditId(t.id)
    setEditForm({ name: t.name, templateKey: t.templateKey })
    setEditTokens(tokensFromRaw(t.styleTokens))
  }

  async function saveEdit(id: string) {
    setEditSaving(true)
    const token = await getToken()
    await fetch(`${API_URL}/api/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name.trim(),
        templateKey: editForm.templateKey.trim().toLowerCase(),
        styleTokens: JSON.stringify(editTokens),
      }),
    })
    setTemplates(prev => prev.map(t => t.id === id ? {
      ...t,
      name: editForm.name.trim(),
      templateKey: editForm.templateKey.trim().toLowerCase(),
      styleTokens: JSON.stringify(editTokens),
    } : t))
    setEditId(null)
    setEditSaving(false)
  }

  async function handleDelete(t: Template) {
    if (!confirm(`Supprimer "${t.name}" ? Irréversible.`)) return
    setDeletingId(t.id)
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/admin/templates/${t.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 409) { alert('Template utilisé par des CVs. Désactivez-le plutôt.'); setDeletingId(null); return }
    setTemplates(prev => prev.filter(x => x.id !== t.id))
    setDeletingId(null)
  }

  function triggerUpload(t: Template) {
    setPendingUpload(t)
    fileInputRef.current?.click()
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pendingUpload) return
    setUploadingId(pendingUpload.id)
    const formData = new FormData()
    formData.append('file', file)
    const token = await getToken()
    const res = await fetch(`${API_URL}/api/admin/templates/${pendingUpload.id}/preview-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (res.ok) {
      const { previewUrl } = await res.json()
      setTemplates(prev => prev.map(t => t.id === pendingUpload.id ? { ...t, previewUrl } : t))
    } else {
      alert(`Erreur upload : ${await res.text()}`)
    }
    setUploadingId(null)
    setPendingUpload(null)
    e.target.value = ''
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-neutral-400">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />

      <h1 className="text-2xl font-serif">Templates &amp; IA</h1>

      {/* Switch IA */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-5 h-5 text-neutral-400" />
          <h2 className="font-semibold">Fournisseur IA actif</h2>
          {aiSaving && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
        </div>
        <div className="flex flex-wrap gap-3">
          {(['claude', 'gemini'] as const).map(p => (
            <button key={p} onClick={() => switchAiProvider(p)} disabled={aiSaving}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${aiProvider === p ? 'bg-white text-black' : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}
            >
              {p === 'claude' ? 'Claude (Anthropic)' : 'Gemini (Google)'}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-3">Appliqué immédiatement à toutes les nouvelles générations de CV.</p>
      </div>

      {/* Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Templates ({templates.length})</h2>
          <button onClick={() => { setShowCreate(!showCreate); setCreateError('') }}
            className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition"
          >
            <Plus className="w-4 h-4" /> Nouveau template
          </button>
        </div>

        {/* Formulaire création */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 mb-4 space-y-3">
            <h3 className="text-sm font-semibold">Créer un template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Nom *</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Élégant Bleu" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Clé unique *</label>
                <input value={createForm.templateKey}
                  onChange={e => setCreateForm(f => ({ ...f, templateKey: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="elegant-bleu" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="create-premium" checked={createForm.isPremium}
                  onChange={e => setCreateForm(f => ({ ...f, isPremium: e.target.checked }))} className="w-4 h-4 accent-white"
                />
                <label htmlFor="create-premium" className="text-sm text-neutral-300">Premium (2000 FCFA)</label>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-1">Style visuel</p>
              <TokenEditor value={createTokens} onChange={setCreateTokens} />
            </div>
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={creating}
                className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setCreateForm(emptyForm); setCreateTokens(emptyTokenForm); setCreateError('') }}
                className="border border-neutral-700 text-neutral-300 text-sm px-4 py-2 rounded-lg hover:border-neutral-500 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-160">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs">
                <th className="text-left px-4 py-3 font-medium w-16">Aperçu</th>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Clé</th>
                <th className="text-left px-4 py-3 font-medium">Style</th>
                <th className="text-center px-3 py-3 font-medium">Actif</th>
                <th className="text-center px-3 py-3 font-medium">Premium</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => {
                const tok = parseTokens(t.styleTokens)
                return (
                  <tr key={t.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition">
                    {/* Aperçu image */}
                    <td className="px-4 py-2">
                      <div className="relative w-10 h-14 bg-neutral-800 rounded overflow-hidden flex items-center justify-center group">
                        {t.previewUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={t.previewUrl} alt={t.name} className="w-full h-full object-cover" />
                          : <span className="text-neutral-600 text-xs">—</span>
                        }
                        <button onClick={() => triggerUpload(t)} disabled={uploadingId === t.id} title="Changer l'image"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          {uploadingId === t.id ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <ImageUp className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </td>

                    {editId === t.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input value={editForm.templateKey} onChange={e => setEditForm(f => ({ ...f, templateKey: e.target.value.toLowerCase() }))}
                            className="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2" colSpan={3}>
                          <TokenEditor value={editTokens} onChange={setEditTokens} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => saveEdit(t.id)} disabled={editSaving}
                              className="text-green-400 hover:text-green-300 p-1.5 rounded hover:bg-green-500/10 transition"
                            >
                              {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditId(null)} className="text-neutral-400 hover:text-white p-1.5 rounded hover:bg-neutral-700 transition">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{t.templateKey}</td>
                        {/* Style swatch */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5" title={`${tok.fontFamily} · ${tok.nameColor} · ${tok.accentColor}`}>
                            <ColorDot color={tok.nameColor} />
                            <ColorDot color={tok.accentColor} />
                            <ColorDot color={tok.dividerColor} />
                            <span className="text-neutral-500 text-xs ml-1">{tok.fontFamily === 'serif' ? 'Serif' : 'Sans'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => toggleTemplate(t.id, 'isActive', t.isActive)} disabled={saving === t.id + 'isActive'} title={t.isActive ? 'Désactiver' : 'Activer'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${t.isActive ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-neutral-800 text-neutral-500 hover:bg-green-500/20 hover:text-green-400'}`}
                          >
                            {saving === t.id + 'isActive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => toggleTemplate(t.id, 'isPremium', t.isPremium)} disabled={saving === t.id + 'isPremium'} title={t.isPremium ? 'Passer gratuit' : 'Passer premium'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${t.isPremium ? 'bg-amber-500/20 text-amber-400 hover:bg-neutral-800 hover:text-neutral-400' : 'bg-neutral-800 text-neutral-500 hover:bg-amber-500/20 hover:text-amber-400'}`}
                          >
                            {saving === t.id + 'isPremium' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.isPremium ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => triggerUpload(t)} disabled={uploadingId === t.id} title="Image aperçu"
                              className="text-neutral-400 hover:text-blue-400 p-1.5 rounded hover:bg-blue-500/10 transition"
                            >
                              {uploadingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageUp className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => startEdit(t)} title="Modifier" className="text-neutral-400 hover:text-white p-1.5 rounded hover:bg-neutral-700 transition">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(t)} disabled={deletingId === t.id} title="Supprimer" className="text-neutral-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition">
                              {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
              {templates.length === 0 && (
                <tr><td colSpan={7} className="text-center text-neutral-500 py-10 text-sm">Aucun template.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
