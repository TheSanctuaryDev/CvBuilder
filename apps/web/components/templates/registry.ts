export type StyleTokens = {
  fontFamily: 'serif' | 'sans-serif'
  nameColor: string
  accentColor: string
  dividerColor: string
  dividerWidth: '1' | '2'
}

export const DEFAULT_TOKENS: StyleTokens = {
  fontFamily: 'serif',
  nameColor: '#111111',
  accentColor: '#6b7280',
  dividerColor: '#d1d5db',
  dividerWidth: '1',
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const ALLOWED_FONT_FAMILY = new Set<string>(['serif', 'sans-serif'])
const ALLOWED_DIVIDER_WIDTH = new Set<string>(['1', '2'])

function sanitizeTokens(raw: Record<string, unknown>): StyleTokens {
  return {
    fontFamily: ALLOWED_FONT_FAMILY.has(String(raw.fontFamily ?? ''))
      ? (raw.fontFamily as StyleTokens['fontFamily'])
      : DEFAULT_TOKENS.fontFamily,
    nameColor: HEX_COLOR_RE.test(String(raw.nameColor ?? ''))
      ? String(raw.nameColor)
      : DEFAULT_TOKENS.nameColor,
    accentColor: HEX_COLOR_RE.test(String(raw.accentColor ?? ''))
      ? String(raw.accentColor)
      : DEFAULT_TOKENS.accentColor,
    dividerColor: HEX_COLOR_RE.test(String(raw.dividerColor ?? ''))
      ? String(raw.dividerColor)
      : DEFAULT_TOKENS.dividerColor,
    dividerWidth: ALLOWED_DIVIDER_WIDTH.has(String(raw.dividerWidth ?? ''))
      ? (raw.dividerWidth as StyleTokens['dividerWidth'])
      : DEFAULT_TOKENS.dividerWidth,
  }
}

export function parseTokens(raw: string | null | undefined): StyleTokens {
  try {
    if (!raw) return DEFAULT_TOKENS
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_TOKENS
    return sanitizeTokens(parsed)
  } catch {
    return DEFAULT_TOKENS
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
  .ml-2 { margin-left: 6px; } .italic { font-style: italic; }
`

export function generatePdfCss(tokens: StyleTokens): string {
  const fontStack = tokens.fontFamily === 'serif'
    ? "Georgia, 'Times New Roman', serif"
    : "'Helvetica Neue', Arial, sans-serif"

  return `
    ${PDF_BASE}
    body { font-family: ${fontStack}; font-size: 12px; color: #111; background: white; }
    .page { width: 794px; min-height: 1123px; padding: 60px 72px; }
    h1 { font-size: 22px; font-weight: 700; color: ${tokens.nameColor}; }
    h2 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${tokens.accentColor}; margin-bottom: 8px; }
    p { line-height: 1.6; }
    hr { border: none; border-top: ${tokens.dividerWidth}px solid ${tokens.dividerColor}; margin: 12px 0; }
    .text-black { color: ${tokens.nameColor}; }
    .text-neutral-700 { color: ${tokens.nameColor}; }
    .text-neutral-600 { color: ${tokens.accentColor}; }
    .text-neutral-500 { color: ${tokens.accentColor}; }
    .text-neutral-400 { color: ${tokens.dividerColor}; }
  `
}

// CSS variables pour l'aperçu en direct (appliquées sur le wrapper CVPreview)
export function generatePreviewVars(tokens: StyleTokens): Record<string, string> {
  const fontStack = tokens.fontFamily === 'serif'
    ? "Georgia, 'Times New Roman', serif"
    : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

  return {
    '--cv-font': fontStack,
    '--cv-name-color': tokens.nameColor,
    '--cv-accent-color': tokens.accentColor,
    '--cv-divider-color': tokens.dividerColor,
    '--cv-divider-width': `${tokens.dividerWidth}px`,
  } as Record<string, string>
}

export function tokensToDocxTheme(tokens: StyleTokens) {
  return {
    heading1Color: tokens.nameColor.replace('#', ''),
    heading2Color: tokens.accentColor.replace('#', ''),
    secondaryColor: tokens.accentColor.replace('#', ''),
  }
}
