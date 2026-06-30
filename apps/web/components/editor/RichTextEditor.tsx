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
import { useEffect, useState, useRef } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight,
  List, Strikethrough, Minus, Plus,
  ChevronDown, ChevronUp, Type as TypeIcon,
} from 'lucide-react'
import { LetterSpacing } from './extensions/LetterSpacing'
import { TextTransform } from './extensions/TextTransform'
import { DualColumn, DualColumnCell } from './extensions/DualColumn'
import { CustomBullet, type BulletMarker } from './extensions/CustomBullet'
import RichStylePanel from './RichStylePanel'

// Marqueurs de liste — affichés en ligne quand une liste est active
const BULLET_MARKERS: { marker: BulletMarker; char: string; label: string }[] = [
  { marker: 'disc',   char: '•', label: 'Disque' },
  { marker: 'circle', char: '○', label: 'Cercle' },
  { marker: 'square', char: '▪', label: 'Carré' },
  { marker: 'check',  char: '✓', label: 'Check' },
  { marker: 'dash',   char: '–', label: 'Tiret' },
  { marker: 'arrow',  char: '›', label: 'Flèche' },
  { marker: 'none',   char: '∅', label: 'Aucun' },
]

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

// Bouton de toolbar avec taille de touch target mobile-friendly (min 40px)
function TBtn({
  onClick, active, children, title,
}: {
  onClick: () => void
  active: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-2 sm:p-1.5 rounded-md transition flex items-center justify-center active:scale-95 ${
        active
          ? 'bg-white text-black'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-700 active:bg-neutral-600'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = 96,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null)
  const advRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Rédigez ici…' }),
      TextStyleKit,
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
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from === to) { setBubble(null); return }
      const start = editor.view.coordsAtPos(from)
      // position:fixed → pas de risque de clipping par overflow:hidden parent
      setBubble({ top: Math.max(8, start.top - 44), left: Math.max(8, start.left - 80) })
    },
    onBlur: () => { setTimeout(() => setBubble(null), 150) },
    editorProps: {
      attributes: {
        // tiptap-plain : masque couleurs/polices déco dans l'éditeur (visible seulement dans le CV)
        class: 'tiptap tiptap-plain px-3 py-2.5 text-sm text-white bg-neutral-900 focus:outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
  })

  // Sync contenu externe (IA enhance, chargement initial)
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const norm = (h: string) => (h === '<p></p>' ? '' : h)
    if (norm(editor.getHTML()) === norm(content || '')) return
    editor.commands.setContent(content || '')
  }, [content, editor])

  // Cleanup au démontage
  useEffect(() => {
    return () => { editor?.destroy() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!editor) return null

  const isInBulletList = editor.isActive('bulletList')
  const activeMarker = (editor.getAttributes('bulletList').bulletMarker ?? 'disc') as BulletMarker
  const currentColor = editor.getAttributes('textStyle').color as string | undefined
  const currentFontSize = parseInt(
    (editor.getAttributes('textStyle').fontSize as string | undefined)?.replace('px', '') || '14',
    10
  )

  return (
    <div className="relative">

      {/* ── Bubble mini-toolbar sur sélection (position:fixed) ── */}
      {bubble && (
        <div
          className="fixed z-[9999] flex items-center gap-0.5 px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl"
          style={{ top: bubble.top, left: bubble.left }}
          onMouseDown={e => e.preventDefault()}
        >
          <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras">
            <Bold className="w-3.5 h-3.5" />
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique">
            <Italic className="w-3.5 h-3.5" />
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
            <Strikethrough className="w-3.5 h-3.5" />
          </TBtn>
          <div className="w-px h-4 bg-neutral-700 mx-0.5" />
          <label
            className="relative w-7 h-7 rounded-md border border-neutral-600 cursor-pointer flex items-center justify-center"
            style={{ backgroundColor: currentColor ?? 'transparent' }}
            title="Couleur"
          >
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={currentColor ?? '#ffffff'}
              onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>
        </div>
      )}

      {/* ── Éditeur + barre d'outils (visuellement liés) ── */}
      <div className={`border border-neutral-700 ${showAdvanced ? 'rounded-t-xl' : 'rounded-xl'} overflow-hidden focus-within:border-neutral-500 transition-colors`}>

        {/* Zone de saisie — styles décoratifs masqués via .tiptap-plain */}
        <EditorContent editor={editor} />

        {/* ── Barre de formatage intégrée ── */}
        <div className="border-t border-neutral-800 bg-neutral-950">

          {/* Ligne 1 : outils principaux */}
          <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5">

            {/* Format de base */}
            <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras (Ctrl+B)">
              <Bold className="w-3.5 h-3.5" />
            </TBtn>
            <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique (Ctrl+I)">
              <Italic className="w-3.5 h-3.5" />
            </TBtn>
            <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné (Ctrl+U)">
              <UnderlineIcon className="w-3.5 h-3.5" />
            </TBtn>
            <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
              <Strikethrough className="w-3.5 h-3.5" />
            </TBtn>

            <div className="w-px h-5 bg-neutral-800 mx-1" />

            {/* Alignement */}
            <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Aligner à gauche">
              <AlignLeft className="w-3.5 h-3.5" />
            </TBtn>
            <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrer">
              <AlignCenter className="w-3.5 h-3.5" />
            </TBtn>
            <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Aligner à droite">
              <AlignRight className="w-3.5 h-3.5" />
            </TBtn>

            <div className="w-px h-5 bg-neutral-800 mx-1" />

            {/* Liste */}
            <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={isInBulletList} title="Liste à puces">
              <List className="w-3.5 h-3.5" />
            </TBtn>

            <div className="w-px h-5 bg-neutral-800 mx-1" />

            {/* Couleur du texte — color picker natif, compatible mobile */}
            <label
              className="relative p-2 sm:p-1.5 rounded-md cursor-pointer hover:bg-neutral-700 transition flex items-center justify-center"
              title="Couleur du texte"
            >
              <div
                className="w-4 h-4 rounded-sm border border-neutral-500 ring-1 ring-white/10"
                style={{ backgroundColor: currentColor ?? 'transparent' }}
              />
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={currentColor ?? '#ffffff'}
                onChange={e => editor.chain().focus().setColor(e.target.value).run()}
              />
            </label>

            {/* Taille de police */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().setFontSize(`${Math.max(6, currentFontSize - 1)}px`).run()
                }}
                className="p-2 sm:p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 active:bg-neutral-600 rounded-md transition"
                title="Réduire la taille"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs text-neutral-500 w-7 text-center select-none tabular-nums">{currentFontSize}</span>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().setFontSize(`${Math.min(96, currentFontSize + 1)}px`).run()
                }}
                className="p-2 sm:p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 active:bg-neutral-600 rounded-md transition"
                title="Agrandir la taille"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Séparateur + bouton options avancées (poussé à droite) */}
            <div className="flex-1" />
            <div className="w-px h-5 bg-neutral-800 mx-1" />
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setShowAdvanced(v => !v) }}
              title="Options typographiques avancées"
              className={`flex items-center gap-1 px-2 py-2 sm:py-1.5 rounded-md text-xs font-medium transition ${
                showAdvanced
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              <span>Aa</span>
              {showAdvanced
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronUp className="w-3 h-3" />
              }
            </button>
          </div>

          {/* Ligne 2 : marqueurs de liste — visible uniquement quand une liste est active */}
          {isInBulletList && (
            <div className="flex items-center gap-1 px-2 pb-2 flex-wrap border-t border-neutral-800/60 pt-1.5">
              <span className="text-[10px] text-neutral-600 mr-1 shrink-0">Style :</span>
              {BULLET_MARKERS.map(({ marker, char, label }) => (
                <button
                  key={marker}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); editor.chain().focus().setBulletMarker(marker).run() }}
                  title={label}
                  className={`w-9 h-9 sm:w-7 sm:h-7 rounded-md text-base leading-none transition flex items-center justify-center ${
                    activeMarker === marker
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-700 active:bg-neutral-600'
                  }`}
                >
                  {char || '∅'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Panneau avancé (collapsible sous l'éditeur) ── */}
      {showAdvanced && (
        <div
          ref={advRef}
          onMouseDown={e => e.preventDefault()}
          className="border border-neutral-700 border-t-0 bg-neutral-950 rounded-b-xl max-h-72 overflow-y-auto"
        >
          <RichStylePanel editor={editor} />
        </div>
      )}
    </div>
  )
}
