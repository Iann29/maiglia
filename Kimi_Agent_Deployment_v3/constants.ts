/**
 * Constantes do Canvas - Maiglia (ATUALIZADO)
 * 
 * Inclui definições visuais dos 9 estilos de cards
 */

// Grid e layout
export const GRID_SIZE = 40;
export const NODE_GAP = 4;
export const CANVAS_PADDING = 40;
export const CANVAS_SIDE_BORDER = 60;
export const MIN_ROWS = 20;

// Dimensões de nodes
export const MIN_NODE_WIDTH = GRID_SIZE * 4;
export const MIN_NODE_HEIGHT = GRID_SIZE * 2;
export const DEFAULT_NODE_WIDTH = GRID_SIZE * 4;
export const DEFAULT_NODE_HEIGHT = GRID_SIZE * 3;
export const NODE_HEADER_HEIGHT = 40;
export const NODE_BORDER_RADIUS = 12;

// Cores padrão para nodes
export const NODE_COLORS = [
  "#FF6B6B", // Vermelho coral
  "#FFB347", // Laranja
  "#FFD93D", // Amarelo
  "#6BCB77", // Verde
  "#4D96FF", // Azul
  "#9B59B6", // Roxo
  "#FF9FF3", // Rosa
  "#A8E6CF", // Menta
];

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
  titleShadow?: string;  // Sombra do texto (opcional)
  // Efeitos
  shadow?: string;       // Sombra do card
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

export function getRandomNodeColor(): string {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
