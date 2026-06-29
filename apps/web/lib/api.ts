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

export async function patchCv(id: string, cvData: unknown) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ cvData }),
  })
  if (!res.ok) throw new Error('Erreur sauvegarde CV')
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

export async function deleteAccountData(): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/account/data`, { method: 'DELETE', headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Erreur suppression des données')
  }
}

export async function deleteAccount(): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/account`, { method: 'DELETE', headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Erreur suppression du compte')
  }
}

export async function initPayment(cvId: string): Promise<{ paymentUrl: string; paymentId: string }> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/payments/init`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cvId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Erreur paiement')
  }
  return res.json()
}
