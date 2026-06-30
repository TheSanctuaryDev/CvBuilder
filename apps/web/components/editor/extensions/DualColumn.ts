import { Node, mergeAttributes } from '@tiptap/core'

// Bloc "ligne deux côtés" : flex justify-between, deux cellules éditables.
// Usage CV : "Intitulé poste [tab] 2022–2024" sur la même ligne.

export const DualColumn = Node.create({
  name: 'dualColumn',
  group: 'block',
  content: 'dualColumnCell dualColumnCell',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dual-column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'dual-column',
        style: 'display:flex;justify-content:space-between;align-items:baseline;gap:8px;',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      insertDualColumn: () => ({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) => commands.insertContent({
        type: 'dualColumn',
        content: [
          { type: 'dualColumnCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gauche' }] }] },
          { type: 'dualColumnCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Droite' }] }] },
        ],
      }),
    } as Record<string, unknown>
  },
})

export const DualColumnCell = Node.create({
  name: 'dualColumnCell',
  group: 'block',
  content: 'block+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dual-column-cell"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'dual-column-cell', style: 'flex:1;' }), 0]
  },
})
