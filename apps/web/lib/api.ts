import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

export async function fetchTemplates() {
  const res = await fetch(`${API_URL}/api/templates`)
  if (!res.ok) throw new Error('Erreur chargement templates')
  return res.json()
}

export async function fetchCvs() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs`, { headers })
  if (!res.ok) throw new Error('Erreur chargement CVs')
  return res.json()
}

export async function createCv(data: { title: string; templateKey: string; isPremium: boolean }) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erreur création CV')
  return res.json()
}

export async function deleteCv(id: string) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error('Erreur suppression CV')
}

export async function fetchCv(id: string) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs/${id}`, { headers })
  if (!res.ok) throw new Error('CV non trouvé')
  return res.json() as Promise<import('@/types').Cv>
}
