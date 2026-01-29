"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TitleSize } from "./canvas-types";

interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { x: number; y: number; nodeLeft?: number };
  nodeId: string;
  currentIcon?: string;
  currentColor: string;
  currentTitleSize: TitleSize;
  currentStyle?: number;
  onClose: () => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onColorChange: (color: string) => void;
  onTitleSizeChange: (size: TitleSize) => void;
  onStyleChange?: (style: number) => void;
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

// Paleta de cores do xTiles (16 cores)
const COLORS = [
  // Linha 1
  "#FF6B6B", // Vermelho coral
  "#FFB347", // Laranja
  "#FFD93D", // Amarelo
  "#6BCB77", // Verde
  "#4D96FF", // Azul
  "#9B59B6", // Roxo
  "#FF9FF3", // Rosa
  "#A8E6CF", // Menta
  // Linha 2
  "#FF8B94", // Rosa claro
  "#FFC93C", // Amarelo ouro
  "#C7F464", // Verde lima
  "#4ECDC4", // Turquesa
  "#5D8AA8", // Azul aço
  "#DDA0DD", // Lilás
  "#F8F8F8", // Branco
  "#2D3436", // Preto/cinza escuro
];

// Estilos de cards (9 variações)
const CARD_STYLES = [
  { id: 0, bg: "#2D3436", header: "#0984E3" },      // Escuro com header azul
  { id: 1, bg: "#2D3436", header: "#636E72" },      // Escuro com header cinza
  { id: 2, bg: "#74B9FF", header: "#0984E3" },      // Azul claro com header azul
  { id: 3, bg: "#2D3436", header: "#2D3436" },      // Todo escuro
  { id: 4, bg: "#636E72", header: "#2D3436" },      // Cinza com header escuro
  { id: 5, bg: "#74B9FF", header: "#FFFFFF" },      // Azul claro com header branco
  { id: 6, bg: "#A8E6CF", header: "#FFFFFF" },      // Menta com header branco
  { id: 7, bg: "#0984E3", header: "#FFFFFF" },      // Azul com header branco
  { id: 8, bg: "#74B9FF", header: "#0984E3" },      // Azul claro com header azul (variação)
];

// Componente de checkmark no canto
const SelectionCheck = () => (
  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0984E3] rounded-full flex items-center justify-center">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
);

export function NodeSettingsPanel({
  isOpen,
  position,
  nodeId,
  currentIcon,
  currentColor,
  currentTitleSize,
  currentStyle = 0,
  onClose,
  onIconClick,
  onRemoveIcon,
  onColorChange,
  onTitleSizeChange,
  onStyleChange,
  onDelete,
  onDuplicate,
}: NodeSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
    },
    [onRemoveIcon, onIconClick]
  );

  if (!isOpen) return null;

  const panelWidth = 280;
  const panelX =
    position.x + panelWidth > window.innerWidth && position.nodeLeft
      ? position.nodeLeft - panelWidth - 8
      : position.x;

  return (
    <div
      ref={panelRef}
      className="fixed z-[10000] bg-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden"
      style={{
        left: panelX,
        top: position.y,
        width: panelWidth,
      }}
    >
      {/* Seção: Ícone */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Ícone</div>
        <div className="flex gap-3">
          {/* Sem ícone */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("remove")}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: !currentIcon ? "#2D3436" : "transparent",
              border: !currentIcon ? "2px solid #0984E3" : "2px solid #444444",
            }}
            title="Sem ícone"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {!currentIcon && <SelectionCheck />}
          </button>

          {/* Emoji */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("emoji")}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg"
            style={{
              backgroundColor: currentIcon ? "#2D3436" : "transparent",
              border: currentIcon ? "2px solid #0984E3" : "2px solid #444444",
            }}
            title="Escolher emoji"
          >
            {currentIcon || "😀"}
            {currentIcon && <SelectionCheck />}
          </button>

          {/* Imagem (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-lg flex items-center justify-center opacity-40 cursor-not-allowed"
            style={{ border: "2px solid #444444" }}
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Ícone da biblioteca (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-lg flex items-center justify-center opacity-40 cursor-not-allowed"
            style={{ border: "2px solid #444444" }}
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção: Título */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Título</div>
        <div className="flex gap-2">
          {TITLE_SIZES.map((size) => {
            const isSelected = currentTitleSize === size.value;
            return (
              <button
                key={size.value}
                type="button"
                onClick={() => onTitleSizeChange(size.value)}
                className="relative flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  backgroundColor: isSelected ? "#2D3436" : "transparent",
                  border: isSelected ? "2px solid #0984E3" : "2px solid #444444",
                  color: isSelected ? "#FFFFFF" : "#888888",
                }}
                title={size.value === "hidden" ? "Ocultar título" : `Tamanho ${size.label}`}
              >
                {size.label}
                {isSelected && <SelectionCheck />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Estilo */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Estilo</div>
        <div className="grid grid-cols-3 gap-2">
          {CARD_STYLES.map((style) => {
            const isSelected = currentStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onStyleChange?.(style.id)}
                className="relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all hover:scale-105"
                style={{
                  border: isSelected ? "2px solid #0984E3" : "2px solid #444444",
                }}
              >
                {/* Header do card */}
                <div 
                  className="h-1/3 w-full"
                  style={{ backgroundColor: style.header }}
                />
                {/* Body do card */}
                <div 
                  className="h-2/3 w-full"
                  style={{ backgroundColor: style.bg }}
                />
                {/* Linhas simulando conteúdo */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <div 
                    className="h-1 rounded"
                    style={{ backgroundColor: style.header === "#FFFFFF" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)", width: "80%" }}
                  />
                  <div 
                    className="h-1 rounded"
                    style={{ backgroundColor: style.header === "#FFFFFF" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)", width: "60%" }}
                  />
                </div>
                {isSelected && <SelectionCheck />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Cor */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Cor</div>
        <div className="grid grid-cols-8 gap-2">
          {COLORS.map((color) => {
            const isSelected = currentColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className="relative w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{ 
                  backgroundColor: color,
                  boxShadow: isSelected ? "0 0 0 2px #1E1E1E, 0 0 0 4px #0984E3" : "none",
                }}
                title={color}
              />
            );
          })}
        </div>
        
        {/* Cores personalizadas */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#888888]">Cores personalizadas</span>
          <button
            type="button"
            className="px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ backgroundColor: "#0984E3", color: "#FFFFFF" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Plus
          </button>
        </div>
        
        {/* Botão de adicionar cor */}
        <button
          type="button"
          className="mt-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ 
            background: "linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Seção: Ações */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full px-3 py-2.5 flex items-center gap-3 text-sm rounded-lg transition-colors hover:bg-[#2D3436]"
          style={{ color: "#FFFFFF" }}
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
          className="w-full px-3 py-2.5 flex items-center gap-3 text-sm rounded-lg transition-colors hover:bg-[#2D3436]"
          style={{ color: "#FF6B6B" }}
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
