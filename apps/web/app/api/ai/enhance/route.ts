// apps/web/app/api/ai/enhance/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? ''
const CLAUDE_MODEL   = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPTS: Record<string, string> = {
  summary: `Tu es un expert en rédaction de CV professionnels. L'utilisateur te donne un texte de profil/accroche en français. Améliore-le en : 1) rendant le style percutant et professionnel, 2) utilisant des verbes d'action forts, 3) conservant toutes les informations existantes, 4) limitant à 4-5 phrases maximum. Réponds uniquement avec le texte amélioré, sans introduction ni explication.`,
  experience: `Tu es un expert en rédaction de CV. L'utilisateur te donne une description d'expérience professionnelle. Améliore-la en : 1) utilisant des verbes d'action au passé (développé, géré, optimisé…), 2) quantifiant les résultats si des chiffres sont présents, 3) structurant en bullet points si pertinent, 4) restant factuel et précis. Réponds uniquement avec le texte amélioré.`,
}

export async function POST(req: NextRequest) {
  // Auth check via Bearer token
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { error: authError } = await supabase.auth.getUser(token)
  if (authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CLAUDE_API_KEY) {
    return NextResponse.json({ error: 'AI non configurée' }, { status: 503 })
  }

  const body = await req.json() as { text: string; type: string; context?: string }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Texte vide' }, { status: 400 })
  }

  const systemPrompt = SYSTEM_PROMPTS[body.type] ?? SYSTEM_PROMPTS.summary
  const userMessage  = body.context
    ? `Contexte : ${body.context}\n\nTexte à améliorer :\n${body.text}`
    : body.text

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[AI enhance] Anthropic error:', err)
      return NextResponse.json({ error: 'Erreur API IA' }, { status: 502 })
    }

    const data = await res.json()
    const enhanced = data.content?.[0]?.text ?? body.text
    return NextResponse.json({ enhanced })
  } catch (e) {
    console.error('[AI enhance] fetch error:', e)
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 500 })
  }
}
