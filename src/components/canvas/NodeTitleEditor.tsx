"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasNode, TitleAlign } from "./canvas-utils";
import { calculateTitleFontSize, getNodeBounds, GRID_SIZE, NODE_HEADER_HEIGHT } from "./canvas-utils";

interface NodeTitleEditorProps {
  node: CanvasNode;
  canvasRect: DOMRect;
  onSave: (title: string, align: TitleAlign) => void;
  onCancel: () => void;
}

export function NodeTitleEditor({ node, canvasRect, onSave, onCancel }: NodeTitleEditorProps) {
  const [title, setTitle] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isReadyRef = useRef(false);

  const bounds = getNodeBounds(node);
  const headerHeight = NODE_HEADER_HEIGHT * GRID_SIZE;
  const fontSize = calculateTitleFontSize(bounds.width);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
      isReadyRef.current = true;
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave(title, node.titleAlign);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (isReadyRef.current) {
      onSave(title, node.titleAlign);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className="fixed z-40 bg-transparent text-white font-semibold outline-none border-none placeholder:text-white/50 px-3"
      style={{
        left: canvasRect.left + bounds.x,
        top: canvasRect.top + bounds.y,
        width: bounds.width,
        height: headerHeight,
        fontSize,
        textAlign: node.titleAlign,
      }}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      placeholder="Digite o título..."
    />
  );
}
