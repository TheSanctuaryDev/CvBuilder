import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterSpacing: {
      setLetterSpacing: (value: string) => ReturnType
      unsetLetterSpacing: () => ReturnType
    }
  }
}

export const LetterSpacing = Extension.create<{ types: string[] }>({
  name: 'letterSpacing',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        letterSpacing: {
          default: null,
          parseHTML: el => (el as HTMLElement).style.letterSpacing || null,
          renderHTML: attrs => attrs.letterSpacing ? { style: `letter-spacing:${attrs.letterSpacing}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setLetterSpacing: (value: string) => ({ chain }) =>
        chain().setMark('textStyle', { letterSpacing: value }).run(),
      unsetLetterSpacing: () => ({ chain }) =>
        chain().setMark('textStyle', { letterSpacing: null }).run(),
    }
  },
})
