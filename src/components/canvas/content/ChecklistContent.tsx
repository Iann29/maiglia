"use client";

import { useState, useCallback, useRef, useEffect } from "react";

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

export function ChecklistContent({ content, onChange, height }: ChecklistContentProps) {
  // Estado local para items (sincroniza com content via useEffect)
  const [items, setItems] = useState<ChecklistItem[]>(() => 
    content?.items ?? [{ id: crypto.randomUUID(), text: "", checked: false }]
  );
  
  // Ref para o item que deve receber foco após render
  const focusItemIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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

  // Salva alterações no parent com debounce
  const saveChanges = useCallback((newItems: ChecklistItem[]) => {
    onChange({ items: newItems });
  }, [onChange]);

  // Toggle checkbox
  const handleToggle = useCallback((itemId: string) => {
    setItems(prev => {
      const newItems = prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      saveChanges(newItems);
      return newItems;
    });
  }, [saveChanges]);

  // Atualiza texto do item
  const handleTextChange = useCallback((itemId: string, text: string) => {
    setItems(prev => {
      const newItems = prev.map(item =>
        item.id === itemId ? { ...item, text } : item
      );
      saveChanges(newItems);
      return newItems;
    });
  }, [saveChanges]);

  // Adiciona novo item
  const addItem = useCallback((afterItemId?: string) => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: "",
      checked: false,
    };
    
    setItems(prev => {
      let newItems: ChecklistItem[];
      if (afterItemId) {
        const index = prev.findIndex(item => item.id === afterItemId);
        newItems = [...prev.slice(0, index + 1), newItem, ...prev.slice(index + 1)];
      } else {
        newItems = [...prev, newItem];
      }
      saveChanges(newItems);
      return newItems;
    });
    
    focusItemIdRef.current = newItem.id;
  }, [saveChanges]);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => {
      if (prev.length <= 1) return prev; // Mantém pelo menos 1 item
      
      const index = prev.findIndex(item => item.id === itemId);
      const newItems = prev.filter(item => item.id !== itemId);
      saveChanges(newItems);
      
      // Foca no item anterior ou próximo
      if (index > 0) {
        focusItemIdRef.current = newItems[index - 1].id;
      } else if (newItems.length > 0) {
        focusItemIdRef.current = newItems[0].id;
      }
      
      return newItems;
    });
  }, [saveChanges]);

  // Handler de teclado para Enter e Backspace
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, item: ChecklistItem) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(item.id);
    } else if (e.key === "Backspace" && item.text === "") {
      e.preventDefault();
      removeItem(item.id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const index = items.findIndex(i => i.id === item.id);
      if (index < items.length - 1) {
        focusItemIdRef.current = items[index + 1].id;
        setItems([...items]); // Força re-render
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const index = items.findIndex(i => i.id === item.id);
      if (index > 0) {
        focusItemIdRef.current = items[index - 1].id;
        setItems([...items]); // Força re-render
      }
    }
  }, [addItem, removeItem, items]);

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
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 py-1 group"
        >
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => handleToggle(item.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              item.checked
                ? "bg-accent border-accent"
                : "border-border-primary hover:border-accent"
            }`}
          >
            {item.checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          
          {/* Texto do item */}
          <input
            ref={(el) => setItemRef(item.id, el)}
            type="text"
            value={item.text}
            onChange={(e) => handleTextChange(item.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, item)}
            placeholder="Novo item..."
            className={`flex-1 bg-transparent outline-none text-sm transition-colors ${
              item.checked
                ? "text-fg-muted line-through"
                : "text-fg-primary"
            } placeholder:text-fg-muted/50`}
          />
          
          {/* Botão de remover (visível no hover) */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="w-5 h-5 flex items-center justify-center text-fg-muted hover:text-fg-primary opacity-0 group-hover:opacity-100 transition-opacity"
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      
      {/* Botão para adicionar novo item */}
      <button
        type="button"
        onClick={() => addItem()}
        className="flex items-center gap-2 py-1.5 text-fg-muted hover:text-fg-primary text-sm transition-colors"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <span>Adicionar item</span>
      </button>
    </div>
  );
}
