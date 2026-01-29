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

// Helpers
export function getRandomNodeColor(): string {
  const colors = getNodeColorsFromTheme();
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomWorkspaceColor(): string {
  return WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)];
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
