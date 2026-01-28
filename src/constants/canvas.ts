/**
 * Constantes do Canvas - Maiglia
 * Fonte única de verdade para constantes usadas no canvas
 * 
 * NOTA: Estas constantes são duplicadas em convex/lib/constants.ts
 * porque o Convex não pode importar arquivos de src/
 */

// Grid e layout
export const GRID_SIZE = 40;
export const CANVAS_PADDING = 40;
export const CANVAS_SIDE_BORDER = 60;
export const MIN_ROWS = 20;

// Dimensões de nodes
export const MIN_NODE_WIDTH = GRID_SIZE * 4; // 160px
export const MIN_NODE_HEIGHT = GRID_SIZE * 2; // 80px
export const DEFAULT_NODE_WIDTH = GRID_SIZE * 4; // 160px
export const DEFAULT_NODE_HEIGHT = GRID_SIZE * 3; // 120px
export const NODE_HEADER_HEIGHT = GRID_SIZE; // 40px
export const NODE_BORDER_RADIUS = 8;

// Cores padrão para nodes
export const NODE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
];

// Cores padrão para workspaces
export const WORKSPACE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ef4444", // red
];

// Helpers
export function getRandomNodeColor(): string {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
}

export function getRandomWorkspaceColor(): string {
  return WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
