// apps/web/lib/sanitize.ts
// Fonctionne côté serveur (Node.js) ET côté client (browser)
import sanitizeHtml from 'sanitize-html'

const OPTS: sanitizeHtml.IOptions = {
  allowedTags: [
    // Blocs texte
    'p', 'br',
    // Formatage inline (TipTap StarterKit + extensions)
    'strong', 'em', 'u', 's',
    'sup', 'sub',
    'span',  // TextStyleKit : couleur, taille, police, espacement, casse, interligne
    'mark',  // Highlight : surlignage multicolore
    // Listes
    'ul', 'ol', 'li',
    // Layout dual-column (TipTap DualColumn node)
    'div',
  ],
  allowedAttributes: {
    '*': ['style'],
    // Dual-column layout
    'div': ['data-type', 'style'],
    // Custom bullet markers via data attributes (CSS custom properties non supportés par sanitize-html)
    'ul': ['data-bullet-marker', 'data-bullet-color', 'data-bullet-size', 'style'],
    'li': ['style'],
  },
  allowedStyles: {
    '*': {
      // Alignement de texte
      'text-align': [/^(left|center|right|justify)$/],
      // Couleur et fond (TextStyleKit Color + Highlight)
      'color': [/^.+$/],
      'background-color': [/^.+$/],
      // Typographie (FontSize, FontFamily)
      'font-size': [/^[\d.]+(px|pt|em|rem|%)$/],
      'font-family': [/^.+$/],
      'font-weight': [/^(bold|normal|[1-9]00)$/],
      'font-style': [/^(italic|normal)$/],
      'text-decoration': [/^.+$/],
      // TextTransform (casse)
      'text-transform': [/^(uppercase|lowercase|capitalize|none)$/],
      // LetterSpacing
      'letter-spacing': [/^-?[\d.]+(em|px|rem)$/],
      // LineHeight (TextStyleKit)
      'line-height': [/^[\d.]+(%|em|rem|px)?$/],
      // Dual-column layout inline
      'display': [/^(flex|block|inline|inline-block)$/],
      'justify-content': [/^(space-between|flex-start|flex-end|center)$/],
      'align-items': [/^(baseline|flex-start|flex-end|center|stretch)$/],
      'gap': [/^[\d.]+(px|em|rem)$/],
      'flex': [/^[\d.]+$/],
      'min-width': [/^[\d.]+(px|em|rem|%)$/],
    },
  },
  disallowedTagsMode: 'discard',
}

export function sanitizeRichText(html: string): string {
  if (!html?.trim()) return ''
  return sanitizeHtml(html, OPTS)
}
