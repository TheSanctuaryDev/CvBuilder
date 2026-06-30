'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyleKit } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight, List,
  Strikethrough, Superscript as SuperIcon, Subscript as SubIcon,
} from 'lucide-react'
import { LetterSpacing } from './extensions/LetterSpacing'
import { TextTransform } from './extensions/TextTransform'
import { DualColumn, DualColumnCell } from './extensions/DualColumn'
import { CustomBullet } from './extensions/CustomBullet'
import { useEditorFocus } from '@/lib/editor-context'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  showToolbar?: boolean
}

function ToolBtn({
  onClick, active, icon: Icon, title, small,
}: {
  onClick: () => void
  active: boolean
  icon: React.FC<{ className?: string }>
  title: string
  small?: boolean
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`${small ? 'p-1' : 'p-1.5'} rounded-md transition ${
        active
          ? 'bg-white text-black'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
      }`}
    >
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    </button>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = 96,
  showToolbar = true,
}: Props) {
  const { setActiveEditor } = useEditorFocus()
  const containerRef = useRef<HTMLDivElement>(null)

  // Bubble menu state — visible only when text is selected
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Rédigez ici…' }),
      TextStyleKit.configure({
        // LineHeight sur textStyle inline — pour bloc, on configure via paragraph
        lineHeight: { types: ['textStyle', 'paragraph'] },
      }),
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      LetterSpacing,
      TextTransform,
      DualColumn,
      DualColumnCell,
      CustomBullet,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    onFocus: ({ editor }) => {
      setActiveEditor(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from === to) { setBubble(null); return }
      const view = editor.view
      const start = view.coordsAtPos(from)
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setBubble({
        top: start.top - rect.top - 44,
        left: Math.max(4, start.left - rect.left - 80),
      })
    },
    onBlur: () => {
      setTimeout(() => setBubble(null), 200)
    },
    editorProps: {
      attributes: {
        class: 'tiptap px-3 py-2 text-sm text-white bg-neutral-900 focus:outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
  })

  // Détruire uniquement au démontage complet
  useEffect(() => {
    return () => { editor?.destroy() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync contenu externe (ex: amélioration IA)
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const norm = (h: string) => (h === '<p></p>' ? '' : h)
    const cur = norm(editor.getHTML())
    const next = norm(content || '')
    if (cur === next) return
    editor.commands.setContent(content || '')
  }, [content, editor])

  if (!editor) return null

  return (
    <div
      ref={containerRef}
      className="border border-neutral-700 rounded-xl overflow-visible focus-within:border-neutral-500 transition-colors relative"
    >
      {/* Bubble mini-toolbar — apparaît sur sélection */}
      {bubble && (
        <div
          className="absolute z-50 flex items-center gap-0.5 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl pointer-events-auto"
          style={{ top: bubble.top, left: bubble.left }}
          onMouseDown={e => e.preventDefault()}
        >
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="Gras" small />
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="Italique" small />
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={UnderlineIcon} title="Souligné" small />
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={Strikethrough} title="Barré" small />
          <div className="w-px h-3.5 bg-neutral-700 mx-0.5" />
          <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} icon={SuperIcon} title="Exposant" small />
          <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} icon={SubIcon} title="Indice" small />
          <div className="w-px h-3.5 bg-neutral-700 mx-0.5" />
          <input
            type="color"
            title="Couleur du texte"
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            value={editor.getAttributes('textStyle').color ?? '#ffffff'}
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
          />
        </div>
      )}

      {showToolbar && (
        <div className="flex items-center flex-wrap gap-0.5 px-2 py-1 border-b border-neutral-800 bg-neutral-950 rounded-t-xl">
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} title="Gras (Ctrl+B)" />
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} title="Italique (Ctrl+I)" />
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={UnderlineIcon} title="Souligné (Ctrl+U)" />
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={Strikethrough} title="Barré" />
          <div className="w-px h-4 bg-neutral-800 mx-1" />
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Gauche" />
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Centre" />
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Droite" />
          <div className="w-px h-4 bg-neutral-800 mx-1" />
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} title="Liste" />
          <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} icon={SuperIcon} title="Exposant" />
          <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} icon={SubIcon} title="Indice" />
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
