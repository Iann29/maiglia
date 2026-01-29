/**
 * Tipos do Canvas - Maiglia (ATUALIZADO)
 * 
 * Sistema de nodes com estilos visuais completos
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
  NODE_COLORS as COLORS,
  getRandomNodeColor,
  getRandomNodeColor as getRandomColor,
  snapToGrid,
} from "./constants";

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

export type NodeType = "note" | "table" | "checklist" | "image";

export interface CanvasNode {
  id: string;
  _serverId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  index: string;
  title: string;
  titleAlign: TitleAlign;
  icon?: string;
  titleSize?: TitleSize;
  style?: NodeStyle;
  type?: NodeType;
  content?: unknown;
}

export function calculateZIndex(fractionalIndex: string): number {
  let result = 0;
  for (let i = 0; i < Math.min(fractionalIndex.length, 10); i++) {
    result += fractionalIndex.charCodeAt(i) * Math.pow(100, 10 - i);
  }
  return Math.floor(result / 1e15);
}
