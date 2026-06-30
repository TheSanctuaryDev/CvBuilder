// apps/web/lib/sanitize.ts
// Fonctionne côté serveur (Node.js) ET côté client (browser)
import sanitizeHtml from 'sanitize-html'

const OPTS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'strong', 'em', 'u', 'br', 'ul', 'ol', 'li'],
  allowedAttributes: {
    p:  ['style'],
    li: ['style'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|center|right|justify)$/],
    },
  },
  disallowedTagsMode: 'discard',
}

export function sanitizeRichText(html: string): string {
  if (!html?.trim()) return ''
  return sanitizeHtml(html, OPTS)
}
