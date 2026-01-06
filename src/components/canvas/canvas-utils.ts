export interface Point {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export const GRID_SIZE = 40;
export const DOT_SIZE = 2;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2;
export const ZOOM_SENSITIVITY = 0.001;

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera
): Point {
  return {
    x: (screenX - camera.x) / camera.scale,
    y: (screenY - camera.y) / camera.scale,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera
): Point {
  return {
    x: worldX * camera.scale + camera.x,
    y: worldY * camera.scale + camera.y,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function snapPointToGrid(point: Point): Point {
  return {
    x: snapToGrid(point.x),
    y: snapToGrid(point.y),
  };
}

export function getCanvasGridColor(): string {
  if (typeof document === "undefined") return "#d4d4d4";
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue("--canvas-grid").trim() || "#d4d4d4";
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  width: number,
  height: number
): void {
  const gridSize = GRID_SIZE;
  const dotSize = DOT_SIZE;

  const startWorld = screenToWorld(0, 0, camera);
  const endWorld = screenToWorld(width, height, camera);

  const startX = Math.floor(startWorld.x / gridSize) * gridSize;
  const startY = Math.floor(startWorld.y / gridSize) * gridSize;
  const endX = Math.ceil(endWorld.x / gridSize) * gridSize;
  const endY = Math.ceil(endWorld.y / gridSize) * gridSize;

  ctx.fillStyle = getCanvasGridColor();

  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      const screen = worldToScreen(x, y, camera);
      ctx.fillRect(
        Math.floor(screen.x),
        Math.floor(screen.y),
        dotSize,
        dotSize
      );
    }
  }
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  camera: Camera,
  isSelected: boolean
): void {
  const screen = worldToScreen(node.x, node.y, camera);
  const size = Math.max(node.size * camera.scale, 8);
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

export function isPointInNode(
  point: Point,
  node: CanvasNode,
  camera: Camera
): boolean {
  const nodeScreen = worldToScreen(node.x, node.y, camera);
  const size = Math.max(node.size * camera.scale, 8);
  const halfSize = size / 2;

  return (
    point.x >= nodeScreen.x - halfSize &&
    point.x <= nodeScreen.x + halfSize &&
    point.y >= nodeScreen.y - halfSize &&
    point.y <= nodeScreen.y + halfSize
  );
}

export function getNodeAtPoint(
  point: Point,
  nodes: CanvasNode[],
  camera: Camera
): CanvasNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (isPointInNode(point, nodes[i], camera)) {
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

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  width: number,
  height: number
): void {
  const origin = worldToScreen(0, 0, camera);

  ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
  ctx.lineWidth = 1;

  // Eixo X (horizontal)
  if (origin.y >= 0 && origin.y <= height) {
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();
  }

  // Eixo Y (vertical)
  if (origin.x >= 0 && origin.x <= width) {
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();
  }

  // Marcador da origem
  if (origin.x >= -10 && origin.x <= width + 10 && origin.y >= -10 && origin.y <= height + 10) {
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
