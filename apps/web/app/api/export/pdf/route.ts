// apps/web/app/api/export/pdf/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import type { CvSection } from '@/types/editor'
import { parseTokens, generatePdfCss, type StyleTokens } from '@/components/templates/registry'

async function renderSectionToMarkup(section: CvSection): Promise<string> {
  // Import dynamique pour éviter la détection statique de react-dom/server par Next.js
  const { renderToStaticMarkup } = await import('react-dom/server')
  const React = (await import('react')).default

  switch (section.type) {
    case 'header': {
      const { default: V } = await import('@/components/cv-sections/HeaderSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'summary': {
      const { default: V } = await import('@/components/cv-sections/SummarySectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'experience': {
      const { default: V } = await import('@/components/cv-sections/ExperienceSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'formation': {
      const { default: V } = await import('@/components/cv-sections/FormationSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'skills': {
      const { default: V } = await import('@/components/cv-sections/SkillsSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'languages': {
      const { default: V } = await import('@/components/cv-sections/LanguagesSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'interests': {
      const { default: V } = await import('@/components/cv-sections/InterestsSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    case 'references': {
      const { default: V } = await import('@/components/cv-sections/ReferencesSectionView')
      return renderToStaticMarkup(React.createElement(V, { section }))
    }
    default: return ''
  }
}


export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error: authError } = await supabase.auth.getUser(token)
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Input validation
    const { sections, styleTokens } = (await req.json()) as { sections: CvSection[], styleTokens?: StyleTokens }
    if (!Array.isArray(sections) || sections.length > 20) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const tokens = parseTokens(styleTokens ? JSON.stringify(styleTokens) : null)
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    const sectionsHtml = (await Promise.all(sorted.map(renderSectionToMarkup))).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${generatePdfCss(tokens)}</style>
</head>
<body>
  <div class="page">${sectionsHtml}</div>
</body>
</html>`

    const { chromium } = await import('playwright-chromium')
    const browser = await chromium.launch()
    let pdfBuffer: Buffer
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle' })
      pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    } finally {
      await browser.close()
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cv.pdf"',
      },
    })
  } catch (err) {
    console.error('PDF export error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
