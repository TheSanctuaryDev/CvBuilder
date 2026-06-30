'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface EditorFocusContextValue {
  activeEditor: Editor | null
  setActiveEditor: (editor: Editor | null) => void
}

const EditorFocusContext = createContext<EditorFocusContextValue | null>(null)

export function EditorFocusProvider({ children }: { children: React.ReactNode }) {
  const [activeEditor, setActiveEditorState] = useState<Editor | null>(null)

  const setActiveEditor = useCallback((editor: Editor | null) => {
    setActiveEditorState(editor)
  }, [])

  return (
    <EditorFocusContext.Provider value={{ activeEditor, setActiveEditor }}>
      {children}
    </EditorFocusContext.Provider>
  )
}

const NOOP_CONTEXT: EditorFocusContextValue = {
  activeEditor: null,
  setActiveEditor: () => {},
}

export function useEditorFocus(): EditorFocusContextValue {
  return useContext(EditorFocusContext) ?? NOOP_CONTEXT
}
