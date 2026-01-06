export interface Point {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  gridX: number;
  gridY: number;
  size: number;
  color: string;
}

export const GRID_SIZE = 40;
export const DOT_SIZE = 3;
export const CANVAS_PADDING = 40;
export const MIN_ROWS = 20;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function gridToScreen(gridX: number, gridY: number): Point {
  return {
    x: CANVAS_PADDING + gridX * GRID_SIZE,
    y: CANVAS_PADDING + gridY * GRID_SIZE,
  };
}

export function screenToGrid(screenX: number, screenY: number): Point {
  return {
    x: Math.round((screenX - CANVAS_PADDING) / GRID_SIZE),
    y: Math.round((screenY - CANVAS_PADDING) / GRID_SIZE),
  };
}

export function getMaxGridX(containerWidth: number): number {
  const usableWidth = containerWidth - CANVAS_PADDING * 2;
  return Math.max(0, Math.floor(usableWidth / GRID_SIZE));
}

export function calculateCanvasHeight(nodes: CanvasNode[], minHeight: number): number {
  if (nodes.length === 0) {
    return Math.max(minHeight, (MIN_ROWS + 2) * GRID_SIZE + CANVAS_PADDING * 2);
  }
  const maxY = Math.max(...nodes.map((n) => n.gridY));
  const contentHeight = (maxY + 3) * GRID_SIZE + CANVAS_PADDING * 2;
  return Math.max(contentHeight, minHeight);
}

export function getCanvasGridColor(): string {
  if (typeof document === "undefined") return "#d4d4d4";
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue("--canvas-grid").trim() || "#d4d4d4";
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maxGridX: number
): void {
  const maxGridY = Math.floor((height - CANVAS_PADDING * 2) / GRID_SIZE);

  ctx.fillStyle = getCanvasGridColor();

  for (let x = 0; x <= maxGridX; x++) {
    for (let y = 0; y <= maxGridY; y++) {
      const screen = gridToScreen(x, y);
      ctx.fillRect(Math.floor(screen.x), Math.floor(screen.y), DOT_SIZE, DOT_SIZE);
    }
  }
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  isSelected: boolean
): void {
  const screen = gridToScreen(node.gridX, node.gridY);
  const size = node.size;
  const halfSize = size / 2;

  const x = Math.floor(screen.x - halfSize);
  const y = Math.floor(screen.y - halfSize);

  ctx.fillStyle = node.color;
  ctx.fillRect(x, y, size, size);

  if (isSelected) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  }
}

export function isPointInNode(screenX: number, screenY: number, node: CanvasNode): boolean {
  const nodeScreen = gridToScreen(node.gridX, node.gridY);
  const halfSize = node.size / 2;

  return (
    screenX >= nodeScreen.x - halfSize &&
    screenX <= nodeScreen.x + halfSize &&
    screenY >= nodeScreen.y - halfSize &&
    screenY <= nodeScreen.y + halfSize
  );
}

export function getNodeAtPoint(
  screenX: number,
  screenY: number,
  nodes: CanvasNode[]
): CanvasNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (isPointInNode(screenX, screenY, nodes[i])) {
      return nodes[i];
    }
  }
  return null;
}

export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getRandomColor(): string {
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function findNextFreePosition(
  nodes: CanvasNode[],
  maxGridX: number
): Point {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }

  const maxY = Math.max(...nodes.map((n) => n.gridY));

  for (let y = 0; y <= maxY + 1; y++) {
    for (let x = 0; x <= maxGridX; x++) {
      const occupied = nodes.some((n) => n.gridX === x && n.gridY === y);
      if (!occupied) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: maxY + 1 };
}
