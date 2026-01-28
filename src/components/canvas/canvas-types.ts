export interface Point {
  x: number;
  y: number;
}

export type TitleAlign = "left" | "center" | "right";

export type NodeType = "note" | "table" | "checklist";

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

export const GRID_SIZE = 40;
export const CANVAS_PADDING = 40;
export const CANVAS_SIDE_BORDER = 60;
export const MIN_ROWS = 20;

export const MIN_NODE_WIDTH = GRID_SIZE * 4; // 160px
export const MIN_NODE_HEIGHT = GRID_SIZE * 2; // 80px
export const DEFAULT_NODE_WIDTH = GRID_SIZE * 4; // 160px
export const DEFAULT_NODE_HEIGHT = GRID_SIZE * 3; // 120px

export const NODE_HEADER_HEIGHT = GRID_SIZE; // 40px
export const NODE_BORDER_RADIUS = 8;

export const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
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
