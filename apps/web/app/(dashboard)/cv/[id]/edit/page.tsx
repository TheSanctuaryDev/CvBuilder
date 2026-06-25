// apps/web/app/(dashboard)/cv/[id]/edit/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CVEditor from '@/components/editor/CVEditor'

export default async function CvEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
  const res = await fetch(`${apiUrl}/api/cvs/${id}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/dashboard')
  const cv = await res.json()

  return (
    <CVEditor
      cvId={id}
      templateKey={cv.templateKey}
      title={cv.title}
    />
  )
}
