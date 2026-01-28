/**
 * Tipos do Canvas - Maiglia
 * 
 * Este arquivo contém apenas TIPOS e funções específicas do canvas.
 * Constantes foram movidas para src/constants/canvas.ts
 */

// Re-exporta constantes do arquivo centralizado para backward compatibility
export {
  GRID_SIZE,
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
