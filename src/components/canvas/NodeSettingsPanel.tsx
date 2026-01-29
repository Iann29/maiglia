"use client";

import { useEffect, useRef, useCallback } from "react";
import { getNodeColorsFromTheme } from "@/constants/canvas";
import type { TitleSize } from "./canvas-types";

interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { x: number; y: number; nodeLeft?: number };
  nodeId: string;
  currentIcon?: string;
  currentColor: string;
  currentTitleSize: TitleSize;
  onClose: () => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onColorChange: (color: string) => void;
  onTitleSizeChange: (size: TitleSize) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TITLE_SIZES: { value: TitleSize; label: string }[] = [
  { value: "hidden", label: "X" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
];

export function NodeSettingsPanel({
  isOpen,
  position,
  nodeId,
  currentIcon,
  currentColor,
  currentTitleSize,
  onClose,
  onIconClick,
  onRemoveIcon,
  onColorChange,
  onTitleSizeChange,
  onDelete,
  onDuplicate,
}: NodeSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const colors = getNodeColorsFromTheme();

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Delay para evitar fechar imediatamente ao abrir
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleIconOptionClick = useCallback(
    (option: "remove" | "emoji" | "image" | "icon") => {
      if (option === "remove") {
        onRemoveIcon();
      } else if (option === "emoji") {
        onIconClick();
      }
      // image e icon são placeholders desabilitados por enquanto
    },
    [onRemoveIcon, onIconClick]
  );

  if (!isOpen) return null;

  // Calcula posição do painel
  const panelWidth = 240;
  const panelX =
    position.x + panelWidth > window.innerWidth && position.nodeLeft
      ? position.nodeLeft - panelWidth - 8
      : position.x;

  return (
    <div
      ref={panelRef}
      className="fixed z-[10000] bg-bg-primary border border-border-primary rounded-xl shadow-xl"
      style={{
        left: panelX,
        top: position.y,
        width: panelWidth,
      }}
    >
      {/* Seção: Ícone */}
      <div className="p-3 border-b border-border-secondary">
        <div className="text-xs text-fg-muted font-medium mb-2">Ícone</div>
        <div className="flex gap-2">
          {/* Sem ícone */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("remove")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              !currentIcon
                ? "bg-accent text-accent-fg"
                : "bg-bg-secondary text-fg-secondary hover:bg-bg-tertiary"
            }`}
            title="Sem ícone"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Emoji */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("emoji")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              currentIcon
                ? "bg-accent text-accent-fg"
                : "bg-bg-secondary text-fg-secondary hover:bg-bg-tertiary"
            }`}
            title="Escolher emoji"
          >
            {currentIcon || "😀"}
          </button>

          {/* Imagem (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg-secondary text-fg-muted opacity-50 cursor-not-allowed"
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Ícone da biblioteca (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg-secondary text-fg-muted opacity-50 cursor-not-allowed"
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção: Título */}
      <div className="p-3 border-b border-border-secondary">
        <div className="text-xs text-fg-muted font-medium mb-2">Título</div>
        <div className="flex gap-1">
          {TITLE_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => onTitleSizeChange(size.value)}
              className={`flex-1 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                currentTitleSize === size.value
                  ? "bg-accent text-accent-fg"
                  : "bg-bg-secondary text-fg-secondary hover:bg-bg-tertiary"
              }`}
              title={size.value === "hidden" ? "Ocultar título" : `Tamanho ${size.label}`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seção: Cor */}
      <div className="p-3 border-b border-border-secondary">
        <div className="text-xs text-fg-muted font-medium mb-2">Cor</div>
        <div className="grid grid-cols-8 gap-1.5">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorChange(color)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                currentColor === color ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-primary" : ""
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Seção: Ações */}
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-fg-primary hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Duplicar
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-error hover:bg-error-bg rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Deletar
        </button>
      </div>
    </div>
  );
}
