'use client'

import { useState, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Superscript, Subscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, Columns2, ChevronDown, Type, Highlighter,
  Minus, Plus,
} from 'lucide-react'
import type { BulletMarker } from './extensions/CustomBullet'

const FONT_FAMILIES = [
  { label: 'Par défaut', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
]

const FONT_SIZES = ['8', '9', '10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36', '48']

const LETTER_SPACINGS = [
  { label: 'Normal', value: '' },
  { label: 'Serré', value: '-0.05em' },
  { label: 'Légèrement espacé', value: '0.05em' },
  { label: 'Espacé', value: '0.1em' },
  { label: 'Large', value: '0.2em' },
  { label: 'Très large', value: '0.3em' },
]

const LINE_HEIGHTS = [
  { label: 'Auto', value: '' },
  { label: '1.0', value: '1.0' },
  { label: '1.2', value: '1.2' },
  { label: '1.4', value: '1.4' },
  { label: '1.6', value: '1.6' },
  { label: '1.8', value: '1.8' },
  { label: '2.0', value: '2.0' },
]

const BULLET_MARKERS: { marker: BulletMarker; label: string; char: string }[] = [
  { marker: 'disc',   label: 'Disque',    char: '•' },
  { marker: 'circle', label: 'Cercle',    char: '○' },
  { marker: 'square', label: 'Carré',     char: '▪' },
  { marker: 'check',  label: 'Check',     char: '✓' },
  { marker: 'dash',   label: 'Tiret',     char: '–' },
  { marker: 'arrow',  label: 'Flèche',    char: '›' },
  { marker: 'none',   label: 'Aucun',     char: '' },
]

const TEXT_TRANSFORMS = [
  { value: '',           label: 'Normal' },
  { value: 'uppercase',  label: 'MAJUSCULES' },
  { value: 'lowercase',  label: 'minuscules' },
  { value: 'capitalize', label: 'Titre' },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function Separator() {
  return <div className="h-px bg-neutral-800 my-3" />
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500 mb-2">{children}</p>
}

function ToggleBtn({
  active, onClick, children, title, small,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
  small?: boolean
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`${small ? 'p-1' : 'p-1.5'} rounded-md transition flex items-center justify-center ${
        active
          ? 'bg-white text-black'
          : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  )
}

function ColorSwatch({
  color, label, onClick, active,
}: { color: string; label?: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-5 h-5 rounded-md border transition ${
        active ? 'border-white scale-110' : 'border-transparent hover:border-neutral-500'
      }`}
      style={{ backgroundColor: color }}
    />
  )
}

// ─── main component ───────────────────────────────────────────────────────────

interface Props {
  editor: Editor
}

export default function RichStylePanel({ editor }: Props) {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)

  const currentColor = editor.getAttributes('textStyle').color ?? '#ffffff'
  const currentHighlight = editor.getAttributes('highlight').color ?? '#ffff00'
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily ?? ''
  const currentFontSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') ?? ''
  const currentLetterSpacing = editor.getAttributes('textStyle').letterSpacing ?? ''
  const currentLineHeight = editor.getAttributes('textStyle').lineHeight ?? ''

  const setFontSize = useCallback((size: string) => {
    if (!size) {
      editor.chain().focus().unsetFontSize().run()
    } else {
      editor.chain().focus().setFontSize(`${size}px`).run()
    }
  }, [editor])

  const setFontFamily = useCallback((family: string) => {
    if (!family) {
      editor.chain().focus().unsetFontFamily().run()
    } else {
      editor.chain().focus().setFontFamily(family).run()
    }
  }, [editor])

  const adjustFontSize = useCallback((delta: number) => {
    const cur = parseInt(currentFontSize || '14', 10)
    const next = Math.max(6, Math.min(96, cur + delta))
    editor.chain().focus().setFontSize(`${next}px`).run()
  }, [editor, currentFontSize])

  const setTextTransform = useCallback((transform: string) => {
    if (!transform) {
      editor.chain().focus().setMark('textStyle', { textTransform: null }).run()
    } else {
      editor.chain().focus().setMark('textStyle', { textTransform: transform }).run()
    }
  }, [editor])

  const isInBulletList = editor.isActive('bulletList')

  return (
    <div className="p-3 space-y-0 text-sm select-none overflow-y-auto max-h-full">

      {/* Format de base */}
      <SectionTitle>Format</SectionTitle>
      <div className="flex flex-wrap gap-1 mb-3">
        <ToggleBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Barré">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Exposant">
          <Superscript className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Indice">
          <Subscript className="w-3.5 h-3.5" />
        </ToggleBtn>
      </div>

      {/* Alignement */}
      <SectionTitle>Alignement</SectionTitle>
      <div className="flex gap-1 mb-3">
        <ToggleBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Gauche">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centré">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Droite">
          <AlignRight className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justifié">
          <AlignJustify className="w-3.5 h-3.5" />
        </ToggleBtn>
      </div>

      <Separator />

      {/* Police */}
      <SectionTitle>Police</SectionTitle>
      <select
        value={currentFontFamily}
        onChange={e => setFontFamily(e.target.value)}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white mb-2 focus:outline-none focus:border-neutral-500"
      >
        {FONT_FAMILIES.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {/* Taille */}
      <SectionTitle>Taille</SectionTitle>
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); adjustFontSize(-1) }}
          className="p-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <Minus className="w-3 h-3" />
        </button>
        <select
          value={currentFontSize}
          onChange={e => setFontSize(e.target.value)}
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-neutral-500"
        >
          <option value="">Auto</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); adjustFontSize(1) }}
          className="p-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Separator />

      {/* Couleur du texte */}
      <SectionTitle>Couleur du texte</SectionTitle>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => { setShowTextColorPicker(v => !v); setShowHighlightPicker(false) }}
            className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition w-full"
          >
            <div className="w-5 h-5 rounded border border-neutral-600" style={{ backgroundColor: currentColor }} />
            <span className="text-xs text-neutral-300 font-mono flex-1 text-left">{currentColor}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>
        </div>
        {showTextColorPicker && (
          <div className="mb-2">
            <HexColorPicker
              color={currentColor.startsWith('#') ? currentColor : '#ffffff'}
              onChange={c => editor.chain().focus().setColor(c).run()}
              style={{ width: '100%', height: '140px' }}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {['#ffffff', '#000000', '#1e3a5f', '#c0392b', '#27ae60', '#2980b9', '#8e44ad', '#e67e22', '#95a5a6', '#7f8c8d'].map(c => (
                <ColorSwatch key={c} color={c} onClick={() => editor.chain().focus().setColor(c).run()} active={currentColor === c} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="mt-1 text-xs text-neutral-500 hover:text-white transition"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Surligneur */}
      <SectionTitle>Surlignage</SectionTitle>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => { setShowHighlightPicker(v => !v); setShowTextColorPicker(false) }}
            className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition w-full"
          >
            <Highlighter className="w-3.5 h-3.5 text-neutral-400" />
            <div className="w-5 h-5 rounded border border-neutral-600" style={{ backgroundColor: currentHighlight }} />
            <span className="text-xs text-neutral-300 font-mono flex-1 text-left">{currentHighlight}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>
        </div>
        {showHighlightPicker && (
          <div className="mb-2">
            <HexColorPicker
              color={currentHighlight.startsWith('#') ? currentHighlight : '#ffff00'}
              onChange={c => editor.chain().focus().toggleHighlight({ color: c }).run()}
              style={{ width: '100%', height: '140px' }}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {['#fef08a', '#bbf7d0', '#bfdbfe', '#fca5a5', '#e9d5ff', '#fed7aa', '#f0f0f0', '#ffffff'].map(c => (
                <ColorSwatch key={c} color={c} onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="mt-1 text-xs text-neutral-500 hover:text-white transition"
            >
              Enlever le surlignage
            </button>
          </div>
        )}
      </div>

      <Separator />

      {/* Espacement des lettres */}
      <SectionTitle>Espacement lettres</SectionTitle>
      <select
        value={currentLetterSpacing}
        onChange={e => {
          const v = e.target.value
          if (v) editor.chain().focus().setLetterSpacing(v).run()
          else editor.chain().focus().unsetLetterSpacing().run()
        }}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white mb-3 focus:outline-none focus:border-neutral-500"
      >
        {LETTER_SPACINGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Interligne */}
      <SectionTitle>Interligne</SectionTitle>
      <select
        value={currentLineHeight}
        onChange={e => {
          const v = e.target.value
          if (v) editor.chain().focus().setMark('textStyle', { lineHeight: v }).run()
          else editor.chain().focus().setMark('textStyle', { lineHeight: null }).run()
        }}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white mb-3 focus:outline-none focus:border-neutral-500"
      >
        {LINE_HEIGHTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>

      <Separator />

      {/* Casse */}
      <SectionTitle>Casse du texte</SectionTitle>
      <div className="grid grid-cols-2 gap-1 mb-3">
        {TEXT_TRANSFORMS.map(t => {
          const isActive = editor.getAttributes('textStyle').textTransform === t.value ||
            (!t.value && !editor.getAttributes('textStyle').textTransform)
          return (
            <button
              key={t.value}
              type="button"
              onMouseDown={e => { e.preventDefault(); setTextTransform(t.value) }}
              className={`px-2 py-1 rounded-md text-[10px] transition border ${
                isActive
                  ? 'border-white bg-white text-black'
                  : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <Separator />

      {/* Mise en page */}
      <SectionTitle>Mise en page</SectionTitle>
      <div className="flex gap-1 mb-3">
        <ToggleBtn
          active={isInBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          <List className="w-3.5 h-3.5" />
        </ToggleBtn>
        <ToggleBtn
          active={false}
          onClick={() => (editor.chain().focus() as unknown as { insertDualColumn: () => { run: () => void } }).insertDualColumn().run()}
          title="Deux colonnes sur une ligne"
        >
          <Columns2 className="w-3.5 h-3.5" />
        </ToggleBtn>
      </div>

      {/* Marqueurs de liste — visible seulement si dans une liste */}
      {isInBulletList && (
        <>
          <SectionTitle>Marqueur de liste</SectionTitle>
          <div className="grid grid-cols-4 gap-1 mb-3">
            {BULLET_MARKERS.map(({ marker, label, char }) => (
              <button
                key={marker}
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().setBulletMarker(marker).run() }}
                title={label}
                className="flex flex-col items-center py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition text-xs gap-0.5"
              >
                <span className="text-sm leading-none">{char || '∅'}</span>
                <span className="text-[9px] text-neutral-500">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  )
}
