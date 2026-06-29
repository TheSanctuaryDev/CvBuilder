export type TemplateDefinition = {
  name: string
  pdfCss: string
  docx: {
    heading1Color: string
    heading2Color: string
    secondaryColor: string
  }
}

const PDF_BASE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .flex { display: flex; } .flex-wrap { flex-wrap: wrap; }
  .gap-2 { gap: 6px; } .gap-3 { gap: 10px; } .gap-4 { gap: 12px; }
  .space-y-4 > * + * { margin-top: 14px; }
  .space-y-3 > * + * { margin-top: 10px; }
  .mb-6 { margin-bottom: 20px; } .mb-5 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 10px; } .mb-2 { margin-bottom: 6px; } .mb-1 { margin-bottom: 4px; }
  .mt-1 { margin-top: 4px; } .mt-2 { margin-top: 6px; } .mt-3 { margin-top: 10px; }
  .text-xs { font-size: 10px; } .text-sm { font-size: 11px; } .text-base { font-size: 13px; }
  .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; } .font-normal { font-weight: 400; }
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

export const templateRegistry: Record<string, TemplateDefinition> = {
  classic: {
    name: 'Classic',
    pdfCss: `
      ${PDF_BASE}
      body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #111; background: white; }
      .page { width: 794px; min-height: 1123px; padding: 60px 72px; }
      h1 { font-size: 22px; font-weight: 700; color: #111; }
      h2 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; margin-bottom: 8px; }
      p { line-height: 1.6; }
      hr { border: none; border-top: 1px solid #d1d5db; margin: 12px 0; }
      .text-black { color: #111; }
      .text-neutral-400 { color: #9ca3af; } .text-neutral-500 { color: #6b7280; }
      .text-neutral-600 { color: #4b5563; } .text-neutral-700 { color: #374151; }
      .italic { font-style: italic; }
    `,
    docx: {
      heading1Color: '111111',
      heading2Color: '666666',
      secondaryColor: '555555',
    },
  },

  modern: {
    name: 'Modern',
    pdfCss: `
      ${PDF_BASE}
      body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #374151; background: white; }
      .page { width: 794px; min-height: 1123px; padding: 60px 72px; }
      h1 { font-size: 24px; font-weight: 700; color: #1e3a5f; letter-spacing: -0.02em; }
      h2 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-bottom: 8px; }
      p { line-height: 1.6; }
      hr { border: none; border-top: 2px solid #bfdbfe; margin: 12px 0; }
      .text-black { color: #1e3a5f; }
      .text-neutral-400 { color: #60a5fa; } .text-neutral-500 { color: #1e40af; }
      .text-neutral-600 { color: #2563eb; } .text-neutral-700 { color: #1e3a5f; }
      .italic { font-style: italic; }
    `,
    docx: {
      heading1Color: '1e3a5f',
      heading2Color: '2563eb',
      secondaryColor: '2563eb',
    },
  },
}

export function getTemplate(key: string): TemplateDefinition {
  return templateRegistry[key] ?? templateRegistry.classic
}
