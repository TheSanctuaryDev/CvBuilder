// apps/web/components/editor/RichTextEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight, List,
} from 'lucide-react'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function ToolBtn({
  onClick, active, icon: Icon, title,
}: {
  onClick: () => void
  active: boolean
  icon: React.FC<{ className?: string }>
  title: string
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-md transition ${
        active
          ? 'bg-white text-black'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}

export default function RichTextEditor({ content, onChange, placeholder, minHeight = 96 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Rédigez ici…' }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Normalise le HTML vide
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'tiptap px-3 py-2 text-sm text-white bg-neutral-900 focus:outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
  })

  // BUG-08 : [] (pas [editor]) — détruire uniquement au démontage du composant,
  // pas à chaque changement de référence editor (ce qui détruirait l'éditeur actif)
  useEffect(() => {
    return () => { editor?.destroy() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mise à jour depuis l'extérieur (ex : amélioration IA) — BUG-08 : normalise '<p></p>' → ''
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const currentHtml  = editor.getHTML()
    const normalizedCurrent  = currentHtml === '<p></p>' ? '' : currentHtml
    const normalizedContent  = content || ''
    if (normalizedCurrent === normalizedContent) return
    editor.commands.setContent(normalizedContent, { emitUpdate: false })
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="border border-neutral-700 rounded-xl overflow-hidden focus-within:border-neutral-500 transition-colors">
      {/* Barre d'outils */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-neutral-800 bg-neutral-950">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="Gras (Ctrl+B)" />
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="Italique (Ctrl+I)" />
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={UnderlineIcon} title="Souligné (Ctrl+U)" />
        <div className="w-px h-4 bg-neutral-800 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Aligner à gauche" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Centrer" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Aligner à droite" />
        <div className="w-px h-4 bg-neutral-800 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} title="Liste à puces" />
      </div>

      {/* Zone d'édition */}
      <EditorContent editor={editor} />
    </div>
  )
}
