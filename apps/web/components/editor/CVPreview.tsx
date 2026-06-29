// apps/web/components/editor/CVPreview.tsx
'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { CvSection, EditorAction } from '@/types/editor'
import SectionBlock from './SectionBlock'

interface CVPreviewProps {
  sections: CvSection[]
  activeSectionId: string | null
  dispatch: React.Dispatch<EditorAction>
  isDragDisabled?: boolean
  templateKey?: string
}

export default function CVPreview({ sections, activeSectionId, dispatch, isDragDisabled, templateKey = 'classic' }: CVPreviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sorted.findIndex(s => s.id === active.id)
    const newIndex = sorted.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    dispatch({ type: 'REORDER', ids: reordered.map(s => s.id) })
  }

  return (
    <div
      className={`bg-white shadow-2xl mx-auto cv-template-${templateKey}`}
      style={{ width: 794, minHeight: 1123, padding: '60px 72px' }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {sorted.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                isActive={section.id === activeSectionId}
                onClick={() => dispatch({ type: 'SET_ACTIVE', id: section.id })}
                isDragDisabled={isDragDisabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
