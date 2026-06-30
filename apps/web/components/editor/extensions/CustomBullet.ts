import { Extension } from '@tiptap/core'

export type BulletMarker = 'disc' | 'circle' | 'square' | 'check' | 'dash' | 'arrow' | 'none'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customBullet: {
      setBulletMarker: (marker: BulletMarker) => ReturnType
    }
  }
}

const MARKER_CONTENT: Record<BulletMarker, string> = {
  disc:   '•',
  circle: '○',
  square: '▪',
  check:  '✓',
  dash:   '–',
  arrow:  '›',
  none:   '',
}

export const CustomBullet = Extension.create({
  name: 'customBullet',
  addOptions: () => ({ types: ['bulletList'] }),

  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        bulletMarker: {
          default: 'disc',
          parseHTML: el => (el as HTMLElement).dataset.bulletMarker || 'disc',
          renderHTML: attrs => {
            const marker = (attrs.bulletMarker ?? 'disc') as BulletMarker
            const content = MARKER_CONTENT[marker]
            return {
              'data-bullet-marker': marker,
              style: `list-style:none;padding-left:1.2em;--bullet-content:"${content}";`,
            }
          },
        },
        bulletColor: {
          default: null,
          parseHTML: el => (el as HTMLElement).dataset.bulletColor || null,
          renderHTML: attrs => attrs.bulletColor
            ? { 'data-bullet-color': attrs.bulletColor, style: `--bullet-color:${attrs.bulletColor};` }
            : {},
        },
        bulletSize: {
          default: null,
          parseHTML: el => (el as HTMLElement).dataset.bulletSize || null,
          renderHTML: attrs => attrs.bulletSize
            ? { 'data-bullet-size': attrs.bulletSize, style: `--bullet-size:${attrs.bulletSize};` }
            : {},
        },
      },
    }]
  },

  addCommands() {
    return {
      setBulletMarker: (marker: BulletMarker) => ({ commands }) =>
        commands.updateAttributes('bulletList', { bulletMarker: marker }),
    }
  },
})

// CSS global à injecter dans globals.css :
// ul[data-bullet-marker] li::before {
//   content: var(--bullet-content, "•");
//   color: var(--bullet-color, currentColor);
//   font-size: var(--bullet-size, 1em);
//   margin-right: 0.4em;
//   display: inline-block;
// }
