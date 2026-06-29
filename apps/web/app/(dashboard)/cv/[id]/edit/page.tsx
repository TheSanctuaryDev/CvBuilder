// apps/web/app/(dashboard)/cv/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CVEditor from '@/components/editor/CVEditor'
import { parseTokens, type StyleTokens } from '@/components/templates/registry'

export default async function CvEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  const auth = `Bearer ${session.access_token}`

  const res = await fetch(`${apiUrl}/api/cvs/${id}`, {
    headers: { Authorization: auth },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/dashboard')
  const cv = await res.json()

  // Récupérer les tokens du template choisi pour l'aperçu en direct
  let styleTokens: StyleTokens = parseTokens(null)
  try {
    const tRes = await fetch(`${apiUrl}/api/templates`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    })
    if (tRes.ok) {
      const templates = await tRes.json()
      const tpl = templates.find((t: { templateKey: string; styleTokens: string }) => t.templateKey === cv.templateKey)
      if (tpl) styleTokens = parseTokens(tpl.styleTokens)
    }
  } catch { /* fallback DEFAULT_TOKENS */ }

  return (
    <CVEditor
      cvId={id}
      templateKey={cv.templateKey}
      styleTokens={styleTokens}
      title={cv.title}
    />
  )
}
