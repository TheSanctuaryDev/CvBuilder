// apps/web/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CvSection } from '@/types/editor'
import HeaderSectionView from '@/components/cv-sections/HeaderSectionView'
import SummarySectionView from '@/components/cv-sections/SummarySectionView'
import ExperienceSectionView from '@/components/cv-sections/ExperienceSectionView'
import FormationSectionView from '@/components/cv-sections/FormationSectionView'
import SkillsSectionView from '@/components/cv-sections/SkillsSectionView'
import LanguagesSectionView from '@/components/cv-sections/LanguagesSectionView'
import InterestsSectionView from '@/components/cv-sections/InterestsSectionView'
import ReferencesSectionView from '@/components/cv-sections/ReferencesSectionView'
import { getTemplate } from '@/components/templates/registry'
import React from 'react'

function renderSectionToMarkup(section: CvSection): string {
  switch (section.type) {
    case 'header': return renderToStaticMarkup(React.createElement(HeaderSectionView, { section }))
    case 'summary': return renderToStaticMarkup(React.createElement(SummarySectionView, { section }))
    case 'experience': return renderToStaticMarkup(React.createElement(ExperienceSectionView, { section }))
    case 'formation': return renderToStaticMarkup(React.createElement(FormationSectionView, { section }))
    case 'skills': return renderToStaticMarkup(React.createElement(SkillsSectionView, { section }))
    case 'languages': return renderToStaticMarkup(React.createElement(LanguagesSectionView, { section }))
    case 'interests': return renderToStaticMarkup(React.createElement(InterestsSectionView, { section }))
    case 'references': return renderToStaticMarkup(React.createElement(ReferencesSectionView, { section }))
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
    const { sections, templateKey } = (await req.json()) as { sections: CvSection[], templateKey?: string }
    if (!Array.isArray(sections) || sections.length > 20) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const template = getTemplate(templateKey ?? 'classic')
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    const sectionsHtml = sorted.map(renderSectionToMarkup).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${template.pdfCss}</style>
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
