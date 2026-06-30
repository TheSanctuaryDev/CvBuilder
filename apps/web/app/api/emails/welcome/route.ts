// apps/web/app/api/emails/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? 'TheCvBuilder <noreply@thecvbuilder.com>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true }) // pas de clé → silencieux
  }

  // Vérification auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = (await req.json().catch(() => ({}))) as { name?: string }
  const displayName = name || user.email.split('@')[0]

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
  <h1 style="color:#111;font-size:24px;">Bienvenue, ${displayName} !</h1>
  <p style="color:#555;">Votre compte TheCvBuilder est prêt. Créez votre premier CV professionnel en quelques minutes grâce à notre IA.</p>
  <a href="${SITE_URL}/cv/nouveau"
     style="display:inline-block;background:#facc15;color:#111;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
    Créer mon CV →
  </a>
  <p style="color:#999;font-size:12px;margin-top:32px;">TheCvBuilder — CV professionnels alimentés par l'IA</p>
</div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [user.email], subject: 'Bienvenue sur TheCvBuilder !', html }),
  })

  if (!res.ok) {
    console.error('[email/welcome] Resend error', res.status, await res.text())
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
