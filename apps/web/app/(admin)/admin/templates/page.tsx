'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, X, Cpu, Plus, Trash2, Pencil, ImageUp } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

type Template = {
  id: string
  name: string
  templateKey: string
  isPremium: boolean
  isActive: boolean
  previewUrl: string | null
}

async function getToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

const emptyForm = { name: '', templateKey: '', isPremium: false, previewUrl: '' }

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [aiProvider, setAiProvider] = useState<'claude' | 'gemini'>('claude')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [aiSaving, setAiSaving] = useState(false)

  // Création
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Édition inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', templateKey: '', previewUrl: '' })
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
        previewUrl: createForm.previewUrl.trim() || null,
      }),
    })
    if (res.status === 409) { setCreateError('Cette clé existe déjà.'); setCreating(false); return }
    if (!res.ok) { setCreateError('Erreur lors de la création.'); setCreating(false); return }
    const created: Template = await res.json()
    setTemplates(prev => [...prev, created])
    setCreateForm(emptyForm)
    setShowCreate(false)
    setCreating(false)
  }

  function startEdit(t: Template) {
    setEditId(t.id)
    setEditForm({ name: t.name, templateKey: t.templateKey, previewUrl: t.previewUrl ?? '' })
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
        previewUrl: editForm.previewUrl.trim() || null,
      }),
    })
    setTemplates(prev => prev.map(t => t.id === id ? {
      ...t,
      name: editForm.name.trim(),
      templateKey: editForm.templateKey.trim().toLowerCase(),
      previewUrl: editForm.previewUrl.trim() || null,
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
      setTemplates(prev => prev.map(t =>
        t.id === pendingUpload.id ? { ...t, previewUrl } : t
      ))
    } else {
      const err = await res.text()
      alert(`Erreur upload : ${err}`)
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
      {/* Input upload caché — partagé par tous les boutons */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleImageChange}
      />

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
            <button
              key={p}
              onClick={() => switchAiProvider(p)}
              disabled={aiSaving}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
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

      {/* Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Templates ({templates.length})</h2>
          <button
            onClick={() => { setShowCreate(!showCreate); setCreateError('') }}
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
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Classic Pro"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Clé unique *</label>
                <input
                  value={createForm.templateKey}
                  onChange={e => setCreateForm(f => ({ ...f, templateKey: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="classic-pro"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="create-premium"
                  checked={createForm.isPremium}
                  onChange={e => setCreateForm(f => ({ ...f, isPremium: e.target.checked }))}
                  className="w-4 h-4 accent-white"
                />
                <label htmlFor="create-premium" className="text-sm text-neutral-300">Premium (2000 FCFA)</label>
              </div>
            </div>
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateForm(emptyForm); setCreateError('') }}
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
                <th className="text-center px-3 py-3 font-medium">Actif</th>
                <th className="text-center px-3 py-3 font-medium">Premium</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition">
                  {/* Aperçu */}
                  <td className="px-4 py-2">
                    <div className="relative w-10 h-14 bg-neutral-800 rounded overflow-hidden flex items-center justify-center group">
                      {t.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.previewUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-neutral-600 text-xs">—</span>
                      )}
                      <button
                        onClick={() => triggerUpload(t)}
                        disabled={uploadingId === t.id}
                        title="Changer l'image"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                      >
                        {uploadingId === t.id
                          ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                          : <ImageUp className="w-4 h-4 text-white" />
                        }
                      </button>
                    </div>
                  </td>

                  {editId === t.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.templateKey}
                          onChange={e => setEditForm(f => ({ ...f, templateKey: e.target.value.toLowerCase() }))}
                          className="w-full bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-neutral-500 text-xs">—</td>
                      <td className="px-3 py-2 text-center text-neutral-500 text-xs">—</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveEdit(t.id)}
                            disabled={editSaving}
                            className="text-green-400 hover:text-green-300 transition p-1.5 rounded hover:bg-green-500/10"
                          >
                            {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="text-neutral-400 hover:text-white transition p-1.5 rounded hover:bg-neutral-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{t.templateKey}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleTemplate(t.id, 'isActive', t.isActive)}
                          disabled={saving === t.id + 'isActive'}
                          title={t.isActive ? 'Désactiver' : 'Activer'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${
                            t.isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-neutral-800 text-neutral-500 hover:bg-green-500/20 hover:text-green-400'
                          }`}
                        >
                          {saving === t.id + 'isActive'
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : t.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleTemplate(t.id, 'isPremium', t.isPremium)}
                          disabled={saving === t.id + 'isPremium'}
                          title={t.isPremium ? 'Passer gratuit' : 'Passer premium'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${
                            t.isPremium
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-neutral-800 hover:text-neutral-400'
                              : 'bg-neutral-800 text-neutral-500 hover:bg-amber-500/20 hover:text-amber-400'
                          }`}
                        >
                          {saving === t.id + 'isPremium'
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : t.isPremium ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => triggerUpload(t)}
                            disabled={uploadingId === t.id}
                            title="Uploader une image d'aperçu"
                            className="text-neutral-400 hover:text-blue-400 transition p-1.5 rounded hover:bg-blue-500/10"
                          >
                            {uploadingId === t.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <ImageUp className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => startEdit(t)}
                            title="Modifier"
                            className="text-neutral-400 hover:text-white transition p-1.5 rounded hover:bg-neutral-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deletingId === t.id}
                            title="Supprimer"
                            className="text-neutral-500 hover:text-red-400 transition p-1.5 rounded hover:bg-red-500/10"
                          >
                            {deletingId === t.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-neutral-500 py-10 text-sm">
                    Aucun template.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
