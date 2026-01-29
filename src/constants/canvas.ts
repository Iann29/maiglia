import type React from "react";

/**
 * Constantes do Canvas - Maiglia
 * Fonte única de verdade para constantes usadas no canvas
 * 
 * NOTA: Estas constantes são duplicadas em convex/lib/constants.ts
 * porque o Convex não pode importar arquivos de src/
 */

// Grid e layout
export const GRID_SIZE = 40;
export const NODE_GAP = 4; // Gap visual entre nodes (4px de cada lado = 8px de separação)
export const CANVAS_PADDING = 40;
export const CANVAS_SIDE_BORDER = 60;
export const MIN_ROWS = 20;

// Dimensões de nodes
export const MIN_NODE_WIDTH = GRID_SIZE * 4; // 160px
export const MIN_NODE_HEIGHT = GRID_SIZE * 2; // 80px
export const DEFAULT_NODE_WIDTH = GRID_SIZE * 4; // 160px
export const DEFAULT_NODE_HEIGHT = GRID_SIZE * 3; // 120px
export const NODE_HEADER_HEIGHT = GRID_SIZE; // 40px
export const NODE_BORDER_RADIUS = 12; // Mais arredondado

// ============================================
// DEFINIÇÕES VISUAIS DOS 9 ESTILOS DE CARDS
// ============================================

export interface CardStyleDefinition {
  id: number;
  name: string;
  // Cores do card
  headerBg: string;      // Cor do header
  bodyBg: string;        // Cor do body
  borderColor: string;   // Cor da borda
  borderWidth: number;   // Largura da borda
  // Texto
  titleColor: string;    // Cor do título
  // Efeitos
  shadow: string;        // Sombra do card
  // Layout
  headerHeight: number;  // Altura do header
  hasHeaderSeparator: boolean; // Linha separadora no header
}

export const CARD_STYLES: Record<number, CardStyleDefinition> = {
  0: {
    id: 0,
    name: "Escuro Azul",
    headerBg: "#0984E3",
    bodyBg: "#2D3436",
    borderColor: "#444444",
    borderWidth: 1,
    titleColor: "#FFFFFF",
    headerHeight: 40,
    hasHeaderSeparator: false,
    shadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  1: {
    id: 1,
    name: "Escuro Cinza",
    headerBg: "#636E72",
    bodyBg: "#2D3436",
    borderColor: "#444444",
    borderWidth: 1,
    titleColor: "#FFFFFF",
    headerHeight: 40,
    hasHeaderSeparator: false,
    shadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  2: {
    id: 2,
    name: "Azul Claro",
    headerBg: "#0984E3",
    bodyBg: "#74B9FF",
    borderColor: "#0984E3",
    borderWidth: 2,
    titleColor: "#FFFFFF",
    headerHeight: 40,
    hasHeaderSeparator: false,
    shadow: "0 4px 20px rgba(9,132,227,0.3)",
  },
  3: {
    id: 3,
    name: "Todo Escuro",
    headerBg: "#2D3436",
    bodyBg: "#2D3436",
    borderColor: "#444444",
    borderWidth: 1,
    titleColor: "#FFFFFF",
    headerHeight: 40,
    hasHeaderSeparator: true,
    shadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  4: {
    id: 4,
    name: "Cinza Escuro",
    headerBg: "#2D3436",
    bodyBg: "#636E72",
    borderColor: "#444444",
    borderWidth: 1,
    titleColor: "#FFFFFF",
    headerHeight: 40,
    hasHeaderSeparator: false,
    shadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  5: {
    id: 5,
    name: "Azul Branco",
    headerBg: "#FFFFFF",
    bodyBg: "#74B9FF",
    borderColor: "#74B9FF",
    borderWidth: 2,
    titleColor: "#2D3436",
    headerHeight: 40,
    hasHeaderSeparator: true,
    shadow: "0 4px 20px rgba(116,185,255,0.3)",
  },
  6: {
    id: 6,
    name: "Menta Branco",
    headerBg: "#FFFFFF",
    bodyBg: "#A8E6CF",
    borderColor: "#A8E6CF",
    borderWidth: 2,
    titleColor: "#2D3436",
    headerHeight: 40,
    hasHeaderSeparator: true,
    shadow: "0 4px 20px rgba(168,230,207,0.3)",
  },
  7: {
    id: 7,
    name: "Azul Vivo",
    headerBg: "#FFFFFF",
    bodyBg: "#0984E3",
    borderColor: "#0984E3",
    borderWidth: 2,
    titleColor: "#0984E3",
    headerHeight: 40,
    hasHeaderSeparator: true,
    shadow: "0 4px 20px rgba(9,132,227,0.3)",
  },
  8: {
    id: 8,
    name: "Azul Suave",
    headerBg: "#0984E3",
    bodyBg: "#74B9FF",
    borderColor: "#0984E3",
    borderWidth: 1,
    titleColor: "#FFFFFF",
    headerHeight: 36,
    hasHeaderSeparator: false,
    shadow: "0 4px 20px rgba(9,132,227,0.2)",
  },
};

// Helper para obter estilo por ID
export function getCardStyle(styleId: number): CardStyleDefinition {
  return CARD_STYLES[styleId] ?? CARD_STYLES[0];
}

// Paleta completa de cores (16 cores)
export const FULL_COLOR_PALETTE = [
  "#FF6B6B", "#FFB347", "#FFD93D", "#6BCB77",
  "#4D96FF", "#9B59B6", "#FF9FF3", "#A8E6CF",
  "#FF8B94", "#FFC93C", "#C7F464", "#4ECDC4",
  "#5D8AA8", "#DDA0DD", "#F8F8F8", "#2D3436",
];

// ============================================
// CONFIGURAÇÕES DE ÍCONE
// ============================================

import type { IconPosition, IconSize, IconStyle } from "@/components/canvas/canvas-types";

// Posições do ícone (Grid 3x3)
export const ICON_POSITIONS: { value: IconPosition; label: string }[] = [
  { value: "top-left", label: "⬉" },
  { value: "top-center", label: "⬆" },
  { value: "top-right", label: "⬈" },
  { value: "center-left", label: "⬅" },
  { value: "center", label: "⏺" },
  { value: "center-right", label: "➡" },
  { value: "bottom-left", label: "⬋" },
  { value: "bottom-center", label: "⬇" },
  { value: "bottom-right", label: "⬊" },
];

// Mapeamento de posições para estilos CSS
export const ICON_POSITION_STYLES: Record<IconPosition, React.CSSProperties> = {
  "top-left": { position: "absolute", top: 8, left: 8 },
  "top-center": { position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" },
  "top-right": { position: "absolute", top: 8, right: 8 },
  "center-left": { position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)" },
  "center": { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  "center-right": { position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)" },
  "bottom-left": { position: "absolute", bottom: 8, left: 8 },
  "bottom-center": { position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)" },
  "bottom-right": { position: "absolute", bottom: 8, right: 8 },
};

// Tamanhos do ícone
export const ICON_SIZES: { value: IconSize; label: string; px: number }[] = [
  { value: "XS", label: "XS", px: 16 },
  { value: "S", label: "S", px: 20 },
  { value: "M", label: "M", px: 24 },
  { value: "L", label: "L", px: 32 },
  { value: "XL", label: "XL", px: 40 },
];

// Helper para obter tamanho em px
export function getIconSizeInPixels(size: IconSize): number {
  const found = ICON_SIZES.find((s) => s.value === size);
  return found?.px ?? 24;
}

// Estilos do ícone
export const ICON_STYLES: { value: IconStyle; label: string; icon: string }[] = [
  { value: "normal", label: "Normal", icon: "😊" },
  { value: "background", label: "Com fundo", icon: "⬜" },
  { value: "border", label: "Com borda", icon: "⬛" },
  { value: "shadow", label: "Com sombra", icon: "✨" },
];

// Helper para gerar estilos CSS do ícone baseado no estilo selecionado
export function getIconStyleCSS(
  style: IconStyle,
  baseColor: string = "#FFFFFF"
): React.CSSProperties {
  const base: React.CSSProperties = {
    transition: "all 0.2s ease",
  };

  switch (style) {
    case "background":
      return {
        ...base,
        backgroundColor: `${baseColor}33`, // 20% opacity
        padding: "4px 8px",
        borderRadius: 8,
      };
    case "border":
      return {
        ...base,
        border: `2px solid ${baseColor}4D`, // 30% opacity
        padding: "2px 6px",
        borderRadius: 6,
      };
    case "shadow":
      return {
        ...base,
        textShadow: `0 2px 8px rgba(0,0,0,0.4)`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
      };
    default:
      return base;
  }
}

// Configurações padrão do ícone
export const DEFAULT_ICON_CONFIG = {
  iconPosition: "top-center" as IconPosition,
  iconSize: "M" as IconSize,
  iconStyle: "normal" as IconStyle,
};

// Cores padrão para nodes (fallback para SSR)
const DEFAULT_NODE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
];

// NODE_COLORS exportado para backward compatibility
export const NODE_COLORS = DEFAULT_NODE_COLORS;

// Cores padrão para workspaces (fallback para SSR)
const DEFAULT_WORKSPACE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ef4444", // red
];

// WORKSPACE_COLORS exportado para backward compatibility
export const WORKSPACE_COLORS = DEFAULT_WORKSPACE_COLORS;

/**
 * Retorna as cores de nodes do tema ativo (lidas das CSS variables)
 * Fallback para cores padrão em SSR ou se CSS vars não estiverem disponíveis
 */
export function getNodeColorsFromTheme(): string[] {
  if (typeof window === "undefined") {
    return DEFAULT_NODE_COLORS; // Fallback para SSR
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const colors: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const color = style.getPropertyValue(`--node-color-${i}`).trim();
    if (color) colors.push(color);
  }
  return colors.length > 0 ? colors : DEFAULT_NODE_COLORS;
}

/**
 * Retorna as cores de workspaces do tema ativo (lidas das CSS variables)
 * Fallback para cores padrão em SSR ou se CSS vars não estiverem disponíveis
 */
export function getWorkspaceColorsFromTheme(): string[] {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_COLORS; // Fallback para SSR
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const colors: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const color = style.getPropertyValue(`--workspace-color-${i}`).trim();
    if (color) colors.push(color);
  }
  return colors.length > 0 ? colors : DEFAULT_WORKSPACE_COLORS;
}

// Helpers
export function getRandomNodeColor(): string {
  const colors = getNodeColorsFromTheme();
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomWorkspaceColor(): string {
  const colors = getWorkspaceColorsFromTheme();
  return colors[Math.floor(Math.random() * colors.length)];
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
