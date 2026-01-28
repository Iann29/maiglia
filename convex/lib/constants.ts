/**
 * Constantes do Backend - Maiglia
 * 
 * NOTA: Estas constantes são duplicadas de src/constants/canvas.ts
 * porque o Convex não pode importar arquivos de src/
 * Se alterar valores aqui, altere também no frontend!
 */

// Grid e layout
export const GRID_SIZE = 40;
export const CANVAS_PADDING = 40;

// Dimensões de nodes
export const DEFAULT_NODE_WIDTH = 160;
export const DEFAULT_NODE_HEIGHT = 120;

// Cores padrão para nodes
export const NODE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

// Cores padrão para workspaces
export const WORKSPACE_COLORS = [
  "#3b82f6", "#22c55e", "#f97316", "#8b5cf6",
  "#ec4899", "#06b6d4", "#eab308", "#ef4444",
];

// Helpers
export function getRandomNodeColor(): string {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
}

export function getWorkspaceColorByIndex(index: number): string {
  return WORKSPACE_COLORS[index % WORKSPACE_COLORS.length];
}
