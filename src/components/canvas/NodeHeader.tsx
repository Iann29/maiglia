"use client";

import { useRef, useEffect } from "react";
import type { CanvasNode, TitleAlign } from "./canvas-types";
import { NODE_HEADER_HEIGHT } from "./canvas-types";

interface NodeHeaderProps {
  node: CanvasNode;
  isEditing: boolean;
  isHovered: boolean;
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (e: React.MouseEvent) => void;
}

export function NodeHeader({
  node,
  isEditing,
  isHovered,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onConfigClick,
}: NodeHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca no input quando entra em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.value = node.title;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isEditing, node.title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSaveTitle(e.currentTarget.value, node.titleAlign);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onSaveTitle(e.currentTarget.value, node.titleAlign);
  };

  const textAlign = node.titleAlign;

  return (
    <div
      className="relative flex items-center px-3 select-none"
      style={{
        height: NODE_HEADER_HEIGHT,
        backgroundColor: node.color,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent text-white font-semibold outline-none placeholder:text-white/50"
          style={{ textAlign }}
          defaultValue={node.title}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Digite o título..."
        />
      ) : (
        <div
          className="flex-1 truncate cursor-text"
          style={{ textAlign }}
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
        >
          {node.title ? (
            <span className="text-white font-semibold">{node.title}</span>
          ) : (
            <span className="text-white/50">Clique para título</span>
          )}
        </div>
      )}

      {/* Config Icon */}
      {(isHovered || isEditing) && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          onClick={onConfigClick}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      )}
    </div>
  );
}
