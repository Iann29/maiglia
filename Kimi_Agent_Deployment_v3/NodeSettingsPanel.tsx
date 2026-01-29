"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TitleSize, NodeStyle } from "./canvas-types";
import { FULL_COLOR_PALETTE, CARD_STYLES, getCardStyle } from "./constants";

interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { x: number; y: number; nodeLeft?: number };
  nodeId: string;
  currentIcon?: string;
  currentColor: string;
  currentTitleSize: TitleSize;
  currentStyle?: NodeStyle;
  onClose: () => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onColorChange: (color: string) => void;
  onTitleSizeChange: (size: TitleSize) => void;
  onStyleChange?: (style: NodeStyle) => void;
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

// Componente de checkmark no canto
const SelectionCheck = () => (
  <div style={{
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    backgroundColor: '#0984E3',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    zIndex: 10,
  }}>
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
      style={{
        position: 'fixed',
        zIndex: 10000,
        left: panelX,
        top: position.y,
        width: panelWidth,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Seção: Ícone */}
      <div style={{ padding: 16, borderBottom: '1px solid #333333' }}>
        <div style={{ fontSize: 12, color: '#888888', fontWeight: 500, marginBottom: 12 }}>Ícone</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Sem ícone */}
          <button
            onClick={() => handleIconOptionClick("remove")}
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: !currentIcon ? '#2D3436' : 'transparent',
              border: !currentIcon ? '2px solid #0984E3' : '2px solid #444444',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {!currentIcon && <SelectionCheck />}
          </button>

          {/* Emoji */}
          <button
            onClick={() => handleIconOptionClick("emoji")}
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              backgroundColor: currentIcon ? '#2D3436' : 'transparent',
              border: currentIcon ? '2px solid #0984E3' : '2px solid #444444',
              cursor: 'pointer',
            }}
          >
            {currentIcon || "😀"}
            {currentIcon && <SelectionCheck />}
          </button>

          {/* Imagem (desabilitado) */}
          <button
            disabled
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.4,
              cursor: 'not-allowed',
              border: '2px solid #444444',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Ícone da biblioteca (desabilitado) */}
          <button
            disabled
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.4,
              cursor: 'not-allowed',
              border: '2px solid #444444',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção: Título */}
      <div style={{ padding: 16, borderBottom: '1px solid #333333' }}>
        <div style={{ fontSize: 12, color: '#888888', fontWeight: 500, marginBottom: 12 }}>Título</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {TITLE_SIZES.map((size) => {
            const isSelected = currentTitleSize === size.value;
            return (
              <button
                key={size.value}
                onClick={() => onTitleSizeChange(size.value)}
                style={{
                  position: 'relative',
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: isSelected ? '#2D3436' : 'transparent',
                  border: isSelected ? '2px solid #0984E3' : '2px solid #444444',
                  color: isSelected ? '#FFFFFF' : '#888888',
                  cursor: 'pointer',
                }}
              >
                {size.label}
                {isSelected && <SelectionCheck />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Estilo */}
      <div style={{ padding: 16, borderBottom: '1px solid #333333' }}>
        <div style={{ fontSize: 12, color: '#888888', fontWeight: 500, marginBottom: 12 }}>Estilo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Object.values(CARD_STYLES).map((style) => {
            const isSelected = currentStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => onStyleChange?.(style.id as NodeStyle)}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: isSelected ? '2px solid #0984E3' : '2px solid #444444',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div style={{ height: '33%', width: '100%', backgroundColor: style.headerBg }} />
                <div style={{ height: '67%', width: '100%', backgroundColor: style.bodyBg }} />
                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                  <div style={{ height: 4, borderRadius: 2, backgroundColor: style.titleColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: '80%', marginBottom: 4 }} />
                  <div style={{ height: 4, borderRadius: 2, backgroundColor: style.titleColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: '60%' }} />
                </div>
                {isSelected && <SelectionCheck />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Cor */}
      <div style={{ padding: 16, borderBottom: '1px solid #333333' }}>
        <div style={{ fontSize: 12, color: '#888888', fontWeight: 500, marginBottom: 12 }}>Cor</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
          {FULL_COLOR_PALETTE.map((color) => {
            const isSelected = currentColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: isSelected ? '0 0 0 2px #1E1E1E, 0 0 0 4px #0984E3' : 'none',
                }}
              />
            );
          })}
        </div>
        
        {/* Cores personalizadas */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#888888' }}>Cores personalizadas</span>
          <button
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#0984E3',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
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
          style={{
            marginTop: 8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Seção: Ações */}
      <div style={{ padding: 12 }}>
        <button
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2D3436'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Duplicar
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            borderRadius: 8,
            backgroundColor: 'transparent',
            color: '#FF6B6B',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2D3436'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
