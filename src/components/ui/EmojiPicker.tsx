"use client";

import { useCallback, useEffect, useRef } from "react";

// Emojis populares organizados por categoria
const EMOJI_CATEGORIES = {
  "Comida": ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🥬", "🥦", "🥒", "🌽", "🥕", "🧅", "🥩", "🍗", "🥚", "🧀", "🥖", "🍕", "🍔", "🌮", "🍜", "🍣"],
  "Objetos": ["📝", "📋", "📌", "📎", "✏️", "📚", "💼", "🎒", "👜", "🛒", "🏠", "🚗", "✈️", "🎁", "💡", "🔑", "💳", "📱", "💻", "🎧"],
  "Atividades": ["⚽", "🏀", "🎾", "🎯", "🎮", "🎨", "🎬", "🎵", "🎤", "📷", "🏃", "🚴", "🏊", "⛷️", "🧘"],
  "Símbolos": ["✅", "❌", "⭐", "❤️", "💚", "💙", "💜", "🧡", "💛", "🤍", "🔥", "💎", "🎉", "👍", "👏"],
};

interface EmojiPickerProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ isOpen, position, onSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  // Ajusta posição para não sair da tela
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 10000001,
  };

  return (
    <div
      ref={pickerRef}
      className="bg-bg-primary border border-border-primary rounded-xl shadow-xl p-3 w-72 max-h-80 overflow-y-auto"
      style={style}
    >
      {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
        <div key={category} className="mb-3">
          <div className="text-xs text-fg-muted font-medium mb-1.5 px-1">
            {category}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-bg-secondary rounded transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
      
      {/* Botão para remover ícone */}
      <div className="border-t border-border-primary pt-2 mt-2">
        <button
          onClick={() => handleEmojiClick("")}
          className="w-full py-1.5 text-sm text-fg-muted hover:text-fg-primary hover:bg-bg-secondary rounded transition-colors"
          type="button"
        >
          Remover ícone
        </button>
      </div>
    </div>
  );
}
