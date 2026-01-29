"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { TitleSize, NodeStyle, IconPosition, IconSize, IconStyle } from "./canvas-types";
import { FULL_COLOR_PALETTE, CARD_STYLES, ICON_POSITIONS, ICON_SIZES, ICON_STYLES } from "@/constants/canvas";

interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { x: number; y: number; nodeLeft?: number };
  nodeId: string;
  currentIcon?: string;
  currentIconPosition?: IconPosition;
  currentIconSize?: IconSize;
  currentIconStyle?: IconStyle;
  currentColor: string;
  currentTitleSize: TitleSize;
  currentStyle?: NodeStyle;
  onClose: () => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onIconPositionChange?: (position: IconPosition) => void;
  onIconSizeChange?: (size: IconSize) => void;
  onIconStyleChange?: (style: IconStyle) => void;
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

// Componente de checkmark no canto para indicar seleção
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

// Botão do grid de posições
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

// Botão de tamanho
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

// Botão de estilo do ícone
interface IconStyleButtonProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const IconStyleButton = ({ selected, onClick, icon, label }: IconStyleButtonProps) => (
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

export function NodeSettingsPanel({
  isOpen,
  position,
  nodeId,
  currentIcon,
  currentIconPosition = "top-center",
  currentIconSize = "M",
  currentIconStyle = "normal",
  currentColor,
  currentTitleSize,
  currentStyle = 0,
  onClose,
  onIconClick,
  onRemoveIcon,
  onIconPositionChange,
  onIconSizeChange,
  onIconStyleChange,
  onColorChange,
  onTitleSizeChange,
  onStyleChange,
  onDelete,
  onDuplicate,
}: NodeSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

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

  // Reset tab when panel opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
    }
  }, [isOpen]);

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

  // Calcula posição do painel
  const panelWidth = 280;
  const panelX =
    position.x + panelWidth > window.innerWidth && position.nodeLeft
      ? position.nodeLeft - panelWidth - 8
      : position.x;

  const tabs = [
    { id: 0, icon: "📌", label: "Ícone" },
    { id: 1, icon: "🎨", label: "Estilo" },
    { id: 2, icon: "⚡", label: "Ações" },
  ];

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
      {/* Header com Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #333333",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: activeTab === tab.id ? "#2D3436" : "transparent",
              color: activeTab === tab.id ? "#FFFFFF" : "#888888",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #0984E3" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = "#2D343680";
                e.currentTarget.style.color = "#AAAAAA";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#888888";
              }
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: 16 }}>
        {/* ============================================
            TAB 0: ÍCONE
            ============================================ */}
        {activeTab === 0 && (
          <>
            {/* Ícone atual */}
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
                    backgroundColor: !currentIcon ? "#2D3436" : "transparent",
                    border: !currentIcon ? "2px solid #0984E3" : "1px solid #444444",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Sem ícone"
                  onMouseEnter={(e) => {
                    if (currentIcon) {
                      e.currentTarget.style.borderColor = "#666666";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentIcon) {
                      e.currentTarget.style.borderColor = "#444444";
                    }
                  }}
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
                  {!currentIcon && <SelectionCheck />}
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
                    backgroundColor: currentIcon ? "#2D3436" : "transparent",
                    border: currentIcon ? "2px solid #0984E3" : "1px solid #444444",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Clique para mudar o emoji"
                  onMouseEnter={(e) => {
                    if (!currentIcon) {
                      e.currentTarget.style.borderColor = "#666666";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!currentIcon) {
                      e.currentTarget.style.borderColor = "#444444";
                    }
                  }}
                >
                  {currentIcon || "😀"}
                  {currentIcon && <SelectionCheck />}
                </button>
              </div>
            </div>

            {/* Posição do Ícone */}
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
                    selected={currentIconPosition === pos.value}
                    onClick={() => onIconPositionChange?.(pos.value)}
                    title={pos.value.replace(/-/g, " ")}
                  >
                    {pos.label}
                  </GridButton>
                ))}
              </div>
            </div>

            {/* Tamanho do Ícone */}
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
                    selected={currentIconSize === size.value}
                    onClick={() => onIconSizeChange?.(size.value)}
                    label={size.label}
                    px={size.px}
                  />
                ))}
              </div>
            </div>

            {/* Estilo do Ícone */}
            <div>
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
                  <IconStyleButton
                    key={style.value}
                    selected={currentIconStyle === style.value}
                    onClick={() => onIconStyleChange?.(style.value)}
                    icon={style.icon}
                    label={style.label}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============================================
            TAB 1: ESTILO
            ============================================ */}
        {activeTab === 1 && (
          <>
            {/* Título */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#AAAAAA", marginBottom: 10 }}>
                Título
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {TITLE_SIZES.map((size) => {
                  const isSelected = currentTitleSize === size.value;
                  return (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => onTitleSizeChange(size.value)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#666666";
                          e.currentTarget.style.color = "#FFFFFF";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#444444";
                          e.currentTarget.style.color = "#888888";
                        }
                      }}
                      style={{
                        position: "relative",
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 500,
                        backgroundColor: isSelected ? "#2D3436" : "transparent",
                        border: isSelected ? "2px solid #0984E3" : "1px solid #444444",
                        color: isSelected ? "#FFFFFF" : "#888888",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {size.label}
                      {isSelected && <SelectionCheck />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estilo do Card */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#AAAAAA", marginBottom: 10 }}>
                Estilo do card
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {Object.values(CARD_STYLES).map((style) => {
                  const isSelected = currentStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => onStyleChange?.(style.id as NodeStyle)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#666666";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#444444";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "4/3",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: isSelected ? "2px solid #0984E3" : "1px solid #444444",
                        cursor: "pointer",
                        padding: 0,
                        backgroundColor: "transparent",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Header preview (33%) */}
                      <div style={{ height: "33%", width: "100%", backgroundColor: style.headerBg }} />
                      {/* Body preview (67%) */}
                      <div style={{ height: "67%", width: "100%", backgroundColor: style.bodyBg }} />
                      {/* Linhas de placeholder */}
                      <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor:
                              style.titleColor === "#FFFFFF" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
                            width: "80%",
                            marginBottom: 4,
                          }}
                        />
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor:
                              style.titleColor === "#FFFFFF" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
                            width: "60%",
                          }}
                        />
                      </div>
                      {isSelected && <SelectionCheck />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cor */}
            <div>
              <div style={{ fontSize: 12, color: "#AAAAAA", marginBottom: 10 }}>
                Cor
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                {FULL_COLOR_PALETTE.map((color) => {
                  const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onColorChange(color)}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = "scale(1.2)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = "scale(1)";
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: color,
                        cursor: "pointer",
                        border: "none",
                        boxShadow: isSelected ? "0 0 0 2px #1E1E1E, 0 0 0 4px #0984E3" : "none",
                        transition: "transform 0.15s ease",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============================================
            TAB 2: AÇÕES
            ============================================ */}
        {activeTab === 2 && (
          <>
            {/* Duplicar */}
            <button
              type="button"
              onClick={() => {
                onDuplicate();
                onClose();
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                borderRadius: 8,
                backgroundColor: "transparent",
                color: "#FFFFFF",
                border: "1px solid #444444",
                cursor: "pointer",
                transition: "all 0.15s ease",
                marginBottom: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2D3436";
                e.currentTarget.style.borderColor = "#666666";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#444444";
              }}
            >
              <svg
                width="18"
                height="18"
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
              Duplicar bloco
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
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                borderRadius: 8,
                backgroundColor: "transparent",
                color: "#FF6B6B",
                border: "1px solid #444444",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2D3436";
                e.currentTarget.style.borderColor = "#FF6B6B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#444444";
              }}
            >
              <svg
                width="18"
                height="18"
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
              Deletar bloco
            </button>
          </>
        )}
      </div>
    </div>
  );
}
