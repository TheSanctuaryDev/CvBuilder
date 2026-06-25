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
import React from 'react'

function renderSectionToMarkup(section: CvSection): string {
  switch (section.type) {
    case 'header': return renderToStaticMarkup(React.createElement(HeaderSectionView, { section }))
    case 'summary': return renderToStaticMarkup(React.createElement(SummarySectionView, { section }))
    case 'experience': return renderToStaticMarkup(React.createElement(ExperienceSectionView, { section }))
    case 'formation': return renderToStaticMarkup(React.createElement(FormationSectionView, { section }))
    case 'skills': return renderToStaticMarkup(React.createElement(SkillsSectionView, { section }))
    case 'languages': return renderToStaticMarkup(React.createElement(LanguagesSectionView, { section }))
    default: return ''
  }
}

const A4_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #111; background: white; }
  .page { width: 794px; min-height: 1123px; padding: 60px 72px; }
  h1 { font-size: 22px; font-weight: 700; }
  h2 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #666; margin-bottom: 8px; }
  p { line-height: 1.6; }
  hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
  .flex { display: flex; } .flex-wrap { flex-wrap: wrap; }
  .gap-2 { gap: 6px; } .gap-3 { gap: 10px; } .gap-4 { gap: 12px; }
  .space-y-4 > * + * { margin-top: 14px; }
  .space-y-3 > * + * { margin-top: 10px; }
  .mb-6 { margin-bottom: 20px; } .mb-5 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 10px; } .mb-2 { margin-bottom: 6px; } .mb-1 { margin-bottom: 4px; }
  .mt-1 { margin-top: 4px; } .mt-2 { margin-top: 6px; } .mt-3 { margin-top: 10px; }
  .text-xs { font-size: 10px; } .text-sm { font-size: 11px; } .text-base { font-size: 13px; }
  .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; }
  .text-neutral-400 { color: #9ca3af; } .text-neutral-500 { color: #6b7280; }
  .text-neutral-600 { color: #4b5563; } .text-neutral-700 { color: #374151; }
  .tracking-widest { letter-spacing: 0.1em; } .tracking-tight { letter-spacing: -0.01em; }
  .leading-relaxed { line-height: 1.65; }
  .justify-between { justify-content: space-between; } .items-baseline { align-items: baseline; }
  .shrink-0 { flex-shrink: 0; }
  .bg-neutral-100 { background: #f5f5f5; } .border-neutral-200 { border-color: #e5e7eb; }
  .rounded-full { border-radius: 9999px; } .border { border: 1px solid; }
  .px-2 { padding-left: 6px; padding-right: 6px; }
  .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
  .ml-2 { margin-left: 6px; }
`

export async function POST(req: NextRequest) {
  try {
    const { sections } = (await req.json()) as { sections: CvSection[] }
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    const sectionsHtml = sorted.map(renderSectionToMarkup).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>${A4_CSS}</style>
</head>
<body>
  <div class="page">${sectionsHtml}</div>
</body>
</html>`

    const { chromium } = await import('playwright-chromium')
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

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
