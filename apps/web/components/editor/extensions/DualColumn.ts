import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dualColumn: {
      insertDualColumn: () => ReturnType
    }
  }
}

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
      insertDualColumn: () => ({ commands }) => commands.insertContent({
        type: 'dualColumn',
        content: [
          { type: 'dualColumnCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gauche' }] }] },
          { type: 'dualColumnCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Droite' }] }] },
        ],
      }),
    }
  },
})

// DualColumnCell n'a pas de group 'block' pour ne pas être insertable hors DualColumn
export const DualColumnCell = Node.create({
  name: 'dualColumnCell',
  content: 'block+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dual-column-cell"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'dual-column-cell', style: 'flex:1;min-width:0;' }), 0]
  },
})
