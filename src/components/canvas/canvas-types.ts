/**
 * Tipos do Canvas - Maiglia
 * 
 * Este arquivo contém apenas TIPOS e funções específicas do canvas.
 * Constantes foram movidas para src/constants/canvas.ts
 */

// Re-exporta constantes do arquivo centralizado para backward compatibility
export {
  GRID_SIZE,
  NODE_GAP,
  CANVAS_PADDING,
  CANVAS_SIDE_BORDER,
  MIN_ROWS,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  NODE_HEADER_HEIGHT,
  NODE_BORDER_RADIUS,
  NODE_COLORS,
  NODE_COLORS as COLORS, // Alias para backward compatibility
  getRandomNodeColor,
  getRandomNodeColor as getRandomColor, // Alias para backward compatibility
  snapToGrid,
} from "@/constants/canvas";

export interface Point {
  x: number;
  y: number;
}

export type TitleAlign = "left" | "center" | "right";

export type TitleSize = "hidden" | "S" | "M" | "L" | "XL";

// Estilos de nodes - 9 variações visuais
export type NodeStyle = 
  | 0   // Escuro com header azul
  | 1   // Escuro com header cinza
  | 2   // Azul claro com header azul
  | 3   // Todo escuro
  | 4   // Cinza com header escuro
  | 5   // Azul claro com header branco
  | 6   // Menta com header branco
  | 7   // Azul com header branco
  | 8;  // Azul claro com header azul (variação)

// Posições do ícone no grid 3x3
export type IconPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// Tamanhos pré-definidos do ícone
export type IconSize = "XS" | "S" | "M" | "L" | "XL";

// Estilos visuais do ícone
export type IconStyle = "normal" | "background" | "border" | "shadow";

export type NodeType = "note" | "table" | "checklist" | "image";

export interface CanvasNode {
  id: string; // clientId - identificador gerado pelo cliente
  _serverId?: string; // _id do Convex (opcional, para debug)
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  index: string; // fractional indexing para z-order
  title: string;
  titleAlign: TitleAlign;
  icon?: string; // Emoji/ícone do node (ex: "🥬")
  iconPosition?: IconPosition; // Posição do ícone no card (default: "top-center")
  iconSize?: IconSize; // Tamanho do ícone (default: "M")
  iconStyle?: IconStyle; // Estilo visual do ícone (default: "normal")
  titleSize?: TitleSize; // Tamanho da fonte do título (default: "M")
  style?: NodeStyle; // Estilo visual do node (default: "default")
  type?: NodeType; // Tipo do node (note, table, checklist)
  content?: unknown; // Conteúdo específico do tipo
}

export function calculateZIndex(fractionalIndex: string): number {
  // Converte fractional index para número baseado na posição lexicográfica
  // Quanto maior o index (mais recente), maior o z-index
  let result = 0;
  for (let i = 0; i < Math.min(fractionalIndex.length, 10); i++) {
    result += fractionalIndex.charCodeAt(i) * Math.pow(100, 10 - i);
  }
  return Math.floor(result / 1e15); // Normaliza para range razoável
}
