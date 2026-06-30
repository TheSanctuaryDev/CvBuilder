// apps/web/app/api/export/docx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  BorderStyle,
} from 'docx'
import type { CvSection, ExperienceSection, FormationSection, CustomSection } from '@/types/editor'
import { parseTokens, tokensToDocxTheme, type StyleTokens } from '@/components/templates/registry'

/** Retire les balises HTML pour l'export DOCX plain-text — BUG-27 : entités HTML complètes */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim()
}

function buildDocxChildren(sections: CvSection[], secondaryColor: string): Paragraph[] {
  const paras: Paragraph[] = []
  // BUG-06 : exclure les sections masquées + trier par order
  const sorted = [...sections].filter(s => !s.hidden).sort((a, b) => a.order - b.order)

  for (const section of sorted) {
    switch (section.type) {
      case 'header': {
        paras.push(
          new Paragraph({
            text: section.fullName,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [new TextRun({ text: section.jobTitle, color: secondaryColor })],
          })
        )
        const contacts = [
          ...(section.emails?.filter(Boolean) ?? []),
          ...(section.phones?.filter(p => p.number).map(p => `${p.indicatif} ${p.number}`) ?? []),
          section.address,
          section.linkedIn,
          section.gitHub,
        ].filter(Boolean).join('  |  ')
        if (contacts) {
          paras.push(new Paragraph({ children: [new TextRun({ text: contacts, size: 18, color: '888888' })] }))
        }
        paras.push(new Paragraph({ text: '' }))
        break
      }

      case 'summary':
        paras.push(
          new Paragraph({ text: 'PROFIL', heading: HeadingLevel.HEADING_2 }),
          // BUG-06 : le texte peut être du HTML (Tiptap) → on le strip
          new Paragraph({ text: stripHtml(section.text) }),
          new Paragraph({ text: '' })
        )
        break

      case 'experience':
        paras.push(new Paragraph({ text: 'EXPÉRIENCES PROFESSIONNELLES', heading: HeadingLevel.HEADING_2 }))
        for (const entry of (section as ExperienceSection).entries) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: entry.title, bold: true }),
                entry.company ? new TextRun({ text: ` · ${entry.company}`, color: secondaryColor }) : new TextRun(''),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: [entry.startDate, entry.endDate].filter(Boolean).join(' – '), size: 18, color: '888888' })],
            }),
            new Paragraph({ text: stripHtml(entry.description ?? '') }),
            new Paragraph({ text: '' })
          )
        }
        break

      case 'formation':
        paras.push(new Paragraph({ text: 'FORMATION', heading: HeadingLevel.HEADING_2 }))
        for (const entry of (section as FormationSection).entries) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: entry.degree, bold: true }),
                entry.school ? new TextRun({ text: ` · ${entry.school}`, color: secondaryColor }) : new TextRun(''),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: entry.year, size: 18, color: '888888' })],
            }),
            new Paragraph({ text: '' })
          )
        }
        break

      case 'skills':
        paras.push(
          new Paragraph({ text: 'COMPÉTENCES', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.items.join('  ·  ') }),
          new Paragraph({ text: '' })
        )
        break

      case 'languages':
        paras.push(
          new Paragraph({ text: 'LANGUES', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.items.join('  ·  ') }),
          new Paragraph({ text: '' })
        )
        break

      case 'interests':
        paras.push(
          new Paragraph({ text: 'CENTRES D\'INTÉRÊT', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.items.join('  ·  ') }),
          new Paragraph({ text: '' })
        )
        break

      case 'references':
        paras.push(
          new Paragraph({ text: 'RÉFÉRENCES', heading: HeadingLevel.HEADING_2 }),
          ...section.items.map(item => new Paragraph({ text: item })),
          new Paragraph({ text: '' })
        )
        break

      // BUG-06 : sections custom absentes du DOCX
      case 'custom': {
        const c = section as CustomSection
        if (c.title?.trim()) {
          paras.push(new Paragraph({ text: c.title.toUpperCase(), heading: HeadingLevel.HEADING_2 }))
        }
        paras.push(
          new Paragraph({ text: stripHtml(c.content ?? '') }),
          new Paragraph({ text: '' })
        )
        break
      }
    }
  }

  return paras
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

    // 2. Input validation + BUG-02 : vérification ownership du CV
    const { cvId, sections, styleTokens } = (await req.json()) as { cvId?: string; sections: CvSection[], styleTokens?: StyleTokens }
    if (!Array.isArray(sections) || sections.length > 20) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (cvId) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
      const ownerCheck = await fetch(`${apiUrl}/api/cvs/${cvId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!ownerCheck.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tokens = parseTokens(styleTokens ? JSON.stringify(styleTokens) : null)
    const theme = tokensToDocxTheme(tokens)

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, // ~2cm
          },
        },
        children: buildDocxChildren(sections, theme.secondaryColor),
      }],
      styles: {
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            run: { size: 44, bold: true, color: theme.heading1Color },
            paragraph: { spacing: { after: 120 } },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            run: { size: 18, bold: true, color: theme.heading2Color, allCaps: true },
            paragraph: { spacing: { before: 280, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'dddddd' } } },
          },
        ],
      },
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="cv.docx"',
      },
    })
  } catch (err) {
    console.error('DOCX export error:', err)
    return NextResponse.json({ error: 'DOCX generation failed' }, { status: 500 })
  }
}
