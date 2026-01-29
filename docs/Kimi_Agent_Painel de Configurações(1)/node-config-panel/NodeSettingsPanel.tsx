"use client";

import { useEffect, useRef, useCallback } from "react";
import type { NodeSettingsPanelProps, IconPosition, IconSize, IconStyle } from "./types";
import { ICON_POSITIONS, ICON_SIZES, ICON_STYLES } from "./constants";

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/**
 * Checkmark de seleção no canto superior direito
 */
const SelectionCheck = () => (
  <div
    style={{
      position: "absolute",
      top: -6,
      right: -6,
      width: 16,
      height: 16,
      backgroundColor: "#0984E3",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      zIndex: 10,
    }}
  >
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
);

/**
 * Botão do grid de posições
 */
interface GridButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

const GridButton = ({ selected, onClick, children, title }: GridButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      position: "relative",
      width: 36,
      height: 36,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: selected ? "#2D3436" : "transparent",
      border: selected ? "2px solid #0984E3" : "1px solid #444444",
      color: selected ? "#FFFFFF" : "#888888",
      cursor: "pointer",
      fontSize: 14,
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#666666";
        e.currentTarget.style.color = "#AAAAAA";
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#444444";
        e.currentTarget.style.color = "#888888";
      }
    }}
  >
    {children}
    {selected && <SelectionCheck />}
  </button>
);

/**
 * Botão de tamanho
 */
interface SizeButtonProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  px: number;
}

const SizeButton = ({ selected, onClick, label, px }: SizeButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={`${label} (${px}px)`}
    style={{
      position: "relative",
      flex: 1,
      height: 40,
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      backgroundColor: selected ? "#2D3436" : "transparent",
      border: selected ? "2px solid #0984E3" : "1px solid #444444",
      color: selected ? "#FFFFFF" : "#888888",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#666666";
        e.currentTarget.style.color = "#AAAAAA";
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#444444";
        e.currentTarget.style.color = "#888888";
      }
    }}
  >
    <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 10, opacity: 0.6 }}>{px}px</span>
    {selected && <SelectionCheck />}
  </button>
);

/**
 * Botão de estilo
 */
interface StyleButtonProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const StyleButton = ({ selected, onClick, icon, label }: StyleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    style={{
      position: "relative",
      flex: 1,
      height: 48,
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: selected ? "#2D3436" : "transparent",
      border: selected ? "2px solid #0984E3" : "1px solid #444444",
      color: selected ? "#FFFFFF" : "#888888",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#666666";
        e.currentTarget.style.color = "#AAAAAA";
      }
    }}
    onMouseLeave={(e) => {
      if (!selected) {
        e.currentTarget.style.borderColor = "#444444";
        e.currentTarget.style.color = "#888888";
      }
    }}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span style={{ fontSize: 10 }}>{label}</span>
    {selected && <SelectionCheck />}
  </button>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function NodeSettingsPanel({
  isOpen,
  position,
  nodeId,
  config,
  onClose,
  onConfigChange,
  onIconClick,
  onRemoveIcon,
  onDuplicate,
  onDelete,
}: NodeSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou pressionar Escape
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

  // Handlers de configuração
  const handlePositionChange = useCallback(
    (position: IconPosition) => {
      onConfigChange({ iconPosition: position });
    },
    [onConfigChange]
  );

  const handleSizeChange = useCallback(
    (size: IconSize) => {
      onConfigChange({ iconSize: size });
    },
    [onConfigChange]
  );

  const handleStyleChange = useCallback(
    (style: IconStyle) => {
      onConfigChange({ iconStyle: style });
    },
    [onConfigChange]
  );

  const handleIconOptionClick = useCallback(
    (option: "remove" | "emoji") => {
      if (option === "remove") {
        onRemoveIcon();
      } else if (option === "emoji") {
        onIconClick();
      }
    },
    [onRemoveIcon, onIconClick]
  );

  if (!isOpen) return null;

  // Calcula posição do painel (evita sair da tela)
  const panelWidth = 280;
  const panelX =
    position.x + panelWidth > window.innerWidth && position.nodeLeft
      ? position.nodeLeft - panelWidth - 8
      : position.x;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        zIndex: 10000,
        left: panelX,
        top: position.y,
        width: panelWidth,
        backgroundColor: "#1E1E1E",
        borderRadius: 12,
        boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
        overflow: "hidden",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header do Painel */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>⚙️</span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          Configurações
        </span>
      </div>

      {/* ============================================
          SEÇÃO: ÍCONE (Principal)
          ============================================ */}
      <div style={{ padding: 16 }}>
        {/* Label da seção */}
        <div
          style={{
            fontSize: 11,
            color: "#888888",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>📌</span> Ícone
        </div>

        {/* -------- Subseção: Seleção de Ícone -------- */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "#AAAAAA",
              marginBottom: 10,
            }}
          >
            Ícone atual
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Sem ícone */}
            <button
              type="button"
              onClick={() => handleIconOptionClick("remove")}
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: !config.icon ? "#2D3436" : "transparent",
                border: !config.icon ? "2px solid #0984E3" : "1px solid #444444",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Sem ícone"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888888"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {!config.icon && <SelectionCheck />}
            </button>

            {/* Emoji atual */}
            <button
              type="button"
              onClick={() => handleIconOptionClick("emoji")}
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                backgroundColor: config.icon ? "#2D3436" : "transparent",
                border: config.icon ? "2px solid #0984E3" : "1px solid #444444",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Clique para mudar o emoji"
            >
              {config.icon || "😀"}
              {config.icon && <SelectionCheck />}
            </button>
          </div>
        </div>

        {/* -------- Subseção: Posição do Ícone -------- */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "#AAAAAA",
              marginBottom: 10,
            }}
          >
            Posição
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              width: "fit-content",
            }}
          >
            {ICON_POSITIONS.map((pos) => (
              <GridButton
                key={pos.value}
                selected={config.iconPosition === pos.value}
                onClick={() => handlePositionChange(pos.value)}
                title={pos.value.replace(/-/g, " ")}
              >
                {pos.label}
              </GridButton>
            ))}
          </div>
        </div>

        {/* -------- Subseção: Tamanho do Ícone -------- */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "#AAAAAA",
              marginBottom: 10,
            }}
          >
            Tamanho
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {ICON_SIZES.map((size) => (
              <SizeButton
                key={size.value}
                selected={config.iconSize === size.value}
                onClick={() => handleSizeChange(size.value)}
                label={size.label}
                px={size.px}
              />
            ))}
          </div>
        </div>

        {/* -------- Subseção: Estilo do Ícone -------- */}
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 12,
              color: "#AAAAAA",
              marginBottom: 10,
            }}
          >
            Estilo
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {ICON_STYLES.map((style) => (
              <StyleButton
                key={style.value}
                selected={config.iconStyle === style.value}
                onClick={() => handleStyleChange(style.value)}
                icon={style.icon}
                label={style.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ============================================
          SEÇÃO: AÇÕES
          ============================================ */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid #333333",
        }}
      >
        {/* Duplicar */}
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            borderRadius: 8,
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s ease",
            marginBottom: 4,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2D3436";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Duplicar
        </button>

        {/* Deletar */}
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            borderRadius: 8,
            backgroundColor: "transparent",
            color: "#FF6B6B",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2D3436";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Deletar
        </button>
      </div>
    </div>
  );
}

export default NodeSettingsPanel;
