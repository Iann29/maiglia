"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Tipo para item de checklist
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// Tipo do content de checklist
export interface ChecklistContentData {
  items: ChecklistItem[];
}

interface ChecklistContentProps {
  content: ChecklistContentData | undefined;
  onChange: (content: ChecklistContentData) => void;
  height: number;
}

// Ícone de grip (6 pontos) para drag handle
function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}

// Componente sortable para cada item
interface SortableItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, item: ChecklistItem) => void;
  onRemove: (id: string) => void;
  setItemRef: (id: string, el: HTMLInputElement | null) => void;
  canRemove: boolean;
}

function SortableItem({
  item,
  onToggle,
  onTextChange,
  onKeyDown,
  onRemove,
  setItemRef,
  canRemove,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 py-1 group"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="w-5 h-5 flex items-center justify-center text-fg-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.checked
            ? "bg-accent border-accent"
            : "border-border-primary hover:border-accent"
        }`}
      >
        {item.checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Texto do item */}
      <input
        ref={(el) => setItemRef(item.id, el)}
        type="text"
        value={item.text}
        onChange={(e) => onTextChange(item.id, e.target.value)}
        onKeyDown={(e) => onKeyDown(e, item)}
        placeholder="Novo item..."
        className={`flex-1 bg-transparent outline-none text-sm transition-colors ${
          item.checked ? "text-fg-muted line-through" : "text-fg-primary"
        } placeholder:text-fg-muted/50`}
      />

      {/* Botão de remover (visível no hover) */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-5 h-5 flex items-center justify-center text-fg-muted hover:text-fg-primary opacity-0 group-hover:opacity-100 transition-opacity"
          tabIndex={-1}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ChecklistContent({ content, onChange, height }: ChecklistContentProps) {
  // Estado local para items (sincroniza com content via useEffect)
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    content?.items ?? [{ id: crypto.randomUUID(), text: "", checked: false }]
  );

  // Ref para o item que deve receber foco após render
  const focusItemIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa arrastar 8px para ativar (evita conflito com click)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincroniza state local quando content externo muda
  useEffect(() => {
    if (content?.items) {
      setItems(content.items);
    }
  }, [content]);

  // Foca no item correto após render
  useEffect(() => {
    if (focusItemIdRef.current) {
      const input = itemRefs.current.get(focusItemIdRef.current);
      if (input) {
        input.focus();
        // Posiciona cursor no final
        input.setSelectionRange(input.value.length, input.value.length);
      }
      focusItemIdRef.current = null;
    }
  });

  // Salva alterações no parent
  const saveChanges = useCallback(
    (newItems: ChecklistItem[]) => {
      onChange({ items: newItems });
    },
    [onChange]
  );

  // Handle drag end - reordena items
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((prev) => {
          const oldIndex = prev.findIndex((item) => item.id === active.id);
          const newIndex = prev.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(prev, oldIndex, newIndex);
          saveChanges(newItems);
          return newItems;
        });
      }
    },
    [saveChanges]
  );

  // Toggle checkbox
  const handleToggle = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        saveChanges(newItems);
        return newItems;
      });
    },
    [saveChanges]
  );

  // Atualiza texto do item
  const handleTextChange = useCallback(
    (itemId: string, text: string) => {
      setItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === itemId ? { ...item, text } : item
        );
        saveChanges(newItems);
        return newItems;
      });
    },
    [saveChanges]
  );

  // Adiciona novo item
  const addItem = useCallback(
    (afterItemId?: string) => {
      const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: "",
        checked: false,
      };

      setItems((prev) => {
        let newItems: ChecklistItem[];
        if (afterItemId) {
          const index = prev.findIndex((item) => item.id === afterItemId);
          newItems = [...prev.slice(0, index + 1), newItem, ...prev.slice(index + 1)];
        } else {
          newItems = [...prev, newItem];
        }
        saveChanges(newItems);
        return newItems;
      });

      focusItemIdRef.current = newItem.id;
    },
    [saveChanges]
  );

  // Remove item
  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        if (prev.length <= 1) return prev; // Mantém pelo menos 1 item

        const index = prev.findIndex((item) => item.id === itemId);
        const newItems = prev.filter((item) => item.id !== itemId);
        saveChanges(newItems);

        // Foca no item anterior ou próximo
        if (index > 0) {
          focusItemIdRef.current = newItems[index - 1].id;
        } else if (newItems.length > 0) {
          focusItemIdRef.current = newItems[0].id;
        }

        return newItems;
      });
    },
    [saveChanges]
  );

  // Handler de teclado para Enter e Backspace
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, item: ChecklistItem) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addItem(item.id);
      } else if (e.key === "Backspace" && item.text === "") {
        e.preventDefault();
        removeItem(item.id);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const index = items.findIndex((i) => i.id === item.id);
        if (index < items.length - 1) {
          focusItemIdRef.current = items[index + 1].id;
          setItems([...items]); // Força re-render
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const index = items.findIndex((i) => i.id === item.id);
        if (index > 0) {
          focusItemIdRef.current = items[index - 1].id;
          setItems([...items]); // Força re-render
        }
      }
    },
    [addItem, removeItem, items]
  );

  // Registra ref do input
  const setItemRef = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  return (
    <div
      className="flex flex-col overflow-y-auto px-3 py-2"
      style={{ height }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onRemove={removeItem}
              setItemRef={setItemRef}
              canRemove={items.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Botão para adicionar novo item */}
      <button
        type="button"
        onClick={() => addItem()}
        className="flex items-center gap-2 py-1.5 text-fg-muted hover:text-fg-primary text-sm transition-colors ml-6"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <span>Adicionar item</span>
      </button>
    </div>
  );
}
