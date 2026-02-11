/**
 * Constantes de Cores - Maiglia
 * Cores para nodes e workspaces, com suporte a temas via CSS variables
 */

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
