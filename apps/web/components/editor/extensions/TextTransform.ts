import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textTransform: {
      setTextTransform: (value: string) => ReturnType
      unsetTextTransform: () => ReturnType
    }
  }
}

export const TextTransform = Extension.create({
  name: 'textTransform',
  addOptions: () => ({ types: ['textStyle'] }),
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        textTransform: {
          default: null,
          parseHTML: el => (el as HTMLElement).style.textTransform || null,
          renderHTML: attrs => attrs.textTransform ? { style: `text-transform:${attrs.textTransform}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setTextTransform: (value: string) => ({ chain }) =>
        chain().setMark('textStyle', { textTransform: value }).run(),
      unsetTextTransform: () => ({ chain }) =>
        chain().setMark('textStyle', { textTransform: null }).run(),
    }
  },
})
