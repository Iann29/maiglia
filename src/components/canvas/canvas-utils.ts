export interface Point {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  color: string;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

export const GRID_SIZE = 40;
export const DOT_SIZE = 3;
export const CANVAS_PADDING = 40;
export const MIN_ROWS = 20;

export const MIN_NODE_WIDTH = 4;
export const MIN_NODE_HEIGHT = 2;
export const DEFAULT_NODE_WIDTH = 4;
export const DEFAULT_NODE_HEIGHT = 3;

export const HANDLE_SIZE = 8;
export const HANDLE_HIT_SIZE = 12;
export const NODE_BORDER_RADIUS = 8;
export const NODE_HEADER_HEIGHT = 1;

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
  const maxY = Math.max(...nodes.map((n) => n.gridY + n.gridHeight));
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

export function getNodeBounds(node: CanvasNode): { x: number; y: number; width: number; height: number } {
  const screen = gridToScreen(node.gridX, node.gridY);
  return {
    x: screen.x,
    y: screen.y,
    width: node.gridWidth * GRID_SIZE,
    height: node.gridHeight * GRID_SIZE,
  };
}

export function getHandlePositions(node: CanvasNode): Record<Exclude<ResizeHandle, null>, Point> {
  const bounds = getNodeBounds(node);
  const halfHandle = HANDLE_SIZE / 2;
  
  return {
    nw: { x: bounds.x - halfHandle, y: bounds.y - halfHandle },
    n: { x: bounds.x + bounds.width / 2 - halfHandle, y: bounds.y - halfHandle },
    ne: { x: bounds.x + bounds.width - halfHandle, y: bounds.y - halfHandle },
    e: { x: bounds.x + bounds.width - halfHandle, y: bounds.y + bounds.height / 2 - halfHandle },
    se: { x: bounds.x + bounds.width - halfHandle, y: bounds.y + bounds.height - halfHandle },
    s: { x: bounds.x + bounds.width / 2 - halfHandle, y: bounds.y + bounds.height - halfHandle },
    sw: { x: bounds.x - halfHandle, y: bounds.y + bounds.height - halfHandle },
    w: { x: bounds.x - halfHandle, y: bounds.y + bounds.height / 2 - halfHandle },
  };
}

export function getResizeHandleAtPoint(
  screenX: number,
  screenY: number,
  node: CanvasNode
): ResizeHandle {
  const handles = getHandlePositions(node);
  const hitSize = HANDLE_HIT_SIZE;
  const halfHit = hitSize / 2;

  for (const [handle, pos] of Object.entries(handles) as [Exclude<ResizeHandle, null>, Point][]) {
    const centerX = pos.x + HANDLE_SIZE / 2;
    const centerY = pos.y + HANDLE_SIZE / 2;
    
    if (
      screenX >= centerX - halfHit &&
      screenX <= centerX + halfHit &&
      screenY >= centerY - halfHit &&
      screenY <= centerY + halfHit
    ) {
      return handle;
    }
  }

  return null;
}

export function getHandleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    default:
      return 'default';
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function getNodeBodyColor(): string {
  if (typeof document === "undefined") return "#ffffff";
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue("--bg-primary").trim() || "#ffffff";
}

export function getNodeBorderColor(): string {
  if (typeof document === "undefined") return "#e5e7eb";
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue("--border-primary").trim() || "#e5e7eb";
}

export function getAccentColor(): string {
  if (typeof document === "undefined") return "#3b82f6";
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue("--accent").trim() || "#3b82f6";
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  isSelected: boolean,
  hoveredHandle: ResizeHandle = null
): void {
  const bounds = getNodeBounds(node);
  const { x, y, width, height } = bounds;
  const headerHeight = NODE_HEADER_HEIGHT * GRID_SIZE;

  ctx.save();

  if (isSelected) {
    ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }

  roundedRect(ctx, x, y, width, height, NODE_BORDER_RADIUS);
  ctx.fillStyle = getNodeBodyColor();
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + NODE_BORDER_RADIUS, y);
  ctx.lineTo(x + width - NODE_BORDER_RADIUS, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + NODE_BORDER_RADIUS);
  ctx.lineTo(x + width, y + headerHeight);
  ctx.lineTo(x, y + headerHeight);
  ctx.lineTo(x, y + NODE_BORDER_RADIUS);
  ctx.quadraticCurveTo(x, y, x + NODE_BORDER_RADIUS, y);
  ctx.closePath();
  ctx.fillStyle = node.color;
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, x, y, width, height, NODE_BORDER_RADIUS);
  ctx.strokeStyle = isSelected ? getAccentColor() : getNodeBorderColor();
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.stroke();

  if (isSelected) {
    const handles = getHandlePositions(node);
    const accentColor = getAccentColor();

    for (const [handle, pos] of Object.entries(handles) as [Exclude<ResizeHandle, null>, Point][]) {
      const isHovered = handle === hoveredHandle;
      const size = isHovered ? HANDLE_SIZE * 1.2 : HANDLE_SIZE;
      const offset = (size - HANDLE_SIZE) / 2;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pos.x - offset, pos.y - offset, size, size);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - offset, pos.y - offset, size, size);
    }
  }

  ctx.restore();
}

export function drawResizePreview(
  ctx: CanvasRenderingContext2D,
  previewBounds: { gridX: number; gridY: number; gridWidth: number; gridHeight: number }
): void {
  const screen = gridToScreen(previewBounds.gridX, previewBounds.gridY);
  const width = previewBounds.gridWidth * GRID_SIZE;
  const height = previewBounds.gridHeight * GRID_SIZE;

  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = getAccentColor();
  ctx.lineWidth = 2;
  roundedRect(ctx, screen.x, screen.y, width, height, NODE_BORDER_RADIUS);
  ctx.stroke();
  ctx.restore();

  const label = `${previewBounds.gridWidth}×${previewBounds.gridHeight}`;
  const labelX = screen.x + width / 2;
  const labelY = screen.y + height / 2;

  ctx.save();
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const metrics = ctx.measureText(label);
  const padding = 8;
  const bgWidth = metrics.width + padding * 2;
  const bgHeight = 24;

  ctx.fillStyle = getAccentColor();
  roundedRect(ctx, labelX - bgWidth / 2, labelY - bgHeight / 2, bgWidth, bgHeight, 4);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, labelX, labelY);
  ctx.restore();
}

export function isPointInNode(screenX: number, screenY: number, node: CanvasNode): boolean {
  const bounds = getNodeBounds(node);

  return (
    screenX >= bounds.x &&
    screenX <= bounds.x + bounds.width &&
    screenY >= bounds.y &&
    screenY <= bounds.y + bounds.height
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

export function isGridCellOccupied(
  gridX: number,
  gridY: number,
  width: number,
  height: number,
  nodes: CanvasNode[],
  excludeNodeId?: string
): boolean {
  for (const node of nodes) {
    if (excludeNodeId && node.id === excludeNodeId) continue;

    const nodeRight = node.gridX + node.gridWidth;
    const nodeBottom = node.gridY + node.gridHeight;
    const testRight = gridX + width;
    const testBottom = gridY + height;

    const overlaps =
      gridX < nodeRight &&
      testRight > node.gridX &&
      gridY < nodeBottom &&
      testBottom > node.gridY;

    if (overlaps) return true;
  }
  return false;
}

export function findNextFreePosition(
  nodes: CanvasNode[],
  maxGridX: number
): Point {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }

  const maxY = Math.max(...nodes.map((n) => n.gridY + n.gridHeight));

  for (let y = 0; y <= maxY + DEFAULT_NODE_HEIGHT; y++) {
    for (let x = 0; x <= maxGridX - DEFAULT_NODE_WIDTH; x++) {
      if (!isGridCellOccupied(x, y, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, nodes)) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: maxY + 1 };
}

export function calculateResize(
  node: CanvasNode,
  handle: ResizeHandle,
  gridPos: Point,
  maxGridX: number
): { gridX: number; gridY: number; gridWidth: number; gridHeight: number } {
  let { gridX, gridY, gridWidth, gridHeight } = node;

  const originalRight = gridX + gridWidth;
  const originalBottom = gridY + gridHeight;

  switch (handle) {
    case 'e':
      gridWidth = Math.max(MIN_NODE_WIDTH, gridPos.x - gridX);
      break;
    case 'w':
      const newXW = Math.min(gridPos.x, originalRight - MIN_NODE_WIDTH);
      gridWidth = originalRight - newXW;
      gridX = newXW;
      break;
    case 's':
      gridHeight = Math.max(MIN_NODE_HEIGHT, gridPos.y - gridY);
      break;
    case 'n':
      const newYN = Math.min(gridPos.y, originalBottom - MIN_NODE_HEIGHT);
      gridHeight = originalBottom - newYN;
      gridY = newYN;
      break;
    case 'se':
      gridWidth = Math.max(MIN_NODE_WIDTH, gridPos.x - gridX);
      gridHeight = Math.max(MIN_NODE_HEIGHT, gridPos.y - gridY);
      break;
    case 'sw':
      const newXSW = Math.min(gridPos.x, originalRight - MIN_NODE_WIDTH);
      gridWidth = originalRight - newXSW;
      gridX = newXSW;
      gridHeight = Math.max(MIN_NODE_HEIGHT, gridPos.y - gridY);
      break;
    case 'ne':
      gridWidth = Math.max(MIN_NODE_WIDTH, gridPos.x - gridX);
      const newYNE = Math.min(gridPos.y, originalBottom - MIN_NODE_HEIGHT);
      gridHeight = originalBottom - newYNE;
      gridY = newYNE;
      break;
    case 'nw':
      const newXNW = Math.min(gridPos.x, originalRight - MIN_NODE_WIDTH);
      gridWidth = originalRight - newXNW;
      gridX = newXNW;
      const newYNW = Math.min(gridPos.y, originalBottom - MIN_NODE_HEIGHT);
      gridHeight = originalBottom - newYNW;
      gridY = newYNW;
      break;
  }

  gridX = Math.max(0, gridX);
  gridY = Math.max(0, gridY);
  
  if (gridX + gridWidth > maxGridX) {
    gridWidth = maxGridX - gridX;
  }

  gridWidth = Math.max(MIN_NODE_WIDTH, gridWidth);
  gridHeight = Math.max(MIN_NODE_HEIGHT, gridHeight);

  return { gridX, gridY, gridWidth, gridHeight };
}
