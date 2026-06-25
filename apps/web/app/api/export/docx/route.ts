// apps/web/app/api/export/docx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  BorderStyle,
} from 'docx'
import type { CvSection, ExperienceSection, FormationSection } from '@/types/editor'

function buildDocxChildren(sections: CvSection[]): Paragraph[] {
  const paras: Paragraph[] = []
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  for (const section of sorted) {
    switch (section.type) {
      case 'header':
        paras.push(
          new Paragraph({
            text: section.fullName,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [new TextRun({ text: section.jobTitle, color: '555555' })],
          })
        )
        const contacts = [section.email, section.phone, section.address, section.linkedIn, section.gitHub]
          .filter(Boolean)
          .join('  |  ')
        if (contacts) {
          paras.push(new Paragraph({ children: [new TextRun({ text: contacts, size: 18, color: '888888' })] }))
        }
        paras.push(new Paragraph({ text: '' }))
        break

      case 'summary':
        paras.push(
          new Paragraph({ text: 'PROFIL', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: section.text }),
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
                entry.company ? new TextRun({ text: ` · ${entry.company}`, color: '555555' }) : new TextRun(''),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: [entry.startDate, entry.endDate].filter(Boolean).join(' – '), size: 18, color: '888888' })],
            }),
            new Paragraph({ text: entry.description }),
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
                entry.school ? new TextRun({ text: ` · ${entry.school}`, color: '555555' }) : new TextRun(''),
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
    }
  }

  return paras
}

export async function POST(req: NextRequest) {
  try {
    const { sections } = (await req.json()) as { sections: CvSection[] }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 }, // ~2cm
          },
        },
        children: buildDocxChildren(sections),
      }],
      styles: {
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            run: { size: 44, bold: true, color: '111111' },
            paragraph: { spacing: { after: 120 } },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            run: { size: 18, bold: true, color: '666666', allCaps: true },
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
