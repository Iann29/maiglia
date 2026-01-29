/**
 * Sistema de Anti-Colisão do Canvas - Maiglia
 * 
 * Funções puras para detecção de colisão e busca de posições livres
 */

import { GRID_SIZE, CANVAS_PADDING } from "./canvas-types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Verifica se dois retângulos se intersectam (AABB collision)
 */
export function rectIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Encontra todos os nodes que colidem com um retângulo
 */
export function findCollisions(
  rect: Rect,
  nodes: Rect[],
  excludeIds: Set<string> | string[],
  nodeIds: string[]
): string[] {
  const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  const collisions: string[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const nodeId = nodeIds[i];
    if (excludeSet.has(nodeId)) continue;
    if (rectIntersects(rect, nodes[i])) {
      collisions.push(nodeId);
    }
  }
  
  return collisions;
}

/**
 * Verifica se uma posição colide com algum node
 */
export function hasCollision(
  rect: Rect,
  nodes: Rect[],
  excludeIds: Set<string> | string[],
  nodeIds: string[]
): boolean {
  const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  
  for (let i = 0; i < nodes.length; i++) {
    if (excludeSet.has(nodeIds[i])) continue;
    if (rectIntersects(rect, nodes[i])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Snap de valor para grid
 */
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Busca em espiral para encontrar a posição livre mais próxima
 * 
 * Algoritmo: Começa na posição desejada e expande em anéis quadrados
 * até encontrar uma posição sem colisão
 * 
 * @returns { x, y, hadCollision } - hadCollision é true se a posição teve que ser ajustada
 */
export function findFreePosition(
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  nodes: Rect[],
  excludeIds: Set<string> | string[],
  nodeIds: string[],
  gridSize: number = GRID_SIZE,
  minX: number = 0,
  minY: number = 0
): { x: number; y: number; hadCollision: boolean } {
  const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  
  // Snap para grid
  const startX = Math.max(snapToGrid(targetX, gridSize), minX);
  const startY = Math.max(snapToGrid(targetY, gridSize), minY);
  
  // Verifica se a posição inicial está livre
  const initialRect: Rect = { x: startX, y: startY, width, height };
  if (!hasCollision(initialRect, nodes, excludeSet, nodeIds)) {
    return { x: startX, y: startY, hadCollision: false };
  }
  
  // Busca em espiral (anéis quadrados crescentes)
  const maxRadius = 50; // Máximo de iterações (50 * GRID_SIZE = 2000px de busca)
  
  for (let radius = 1; radius <= maxRadius; radius++) {
    const offset = radius * gridSize;
    
    // Gera posições no perímetro do quadrado atual
    // Prioriza: baixo, direita, esquerda, cima (mais natural para layouts)
    const positions: Array<{ x: number; y: number }> = [];
    
    // Lado inferior (prioridade máxima)
    for (let dx = -radius; dx <= radius; dx++) {
      positions.push({ x: startX + dx * gridSize, y: startY + offset });
    }
    
    // Lado direito
    for (let dy = -radius; dy < radius; dy++) {
      positions.push({ x: startX + offset, y: startY + dy * gridSize });
    }
    
    // Lado esquerdo
    for (let dy = -radius; dy < radius; dy++) {
      positions.push({ x: startX - offset, y: startY + dy * gridSize });
    }
    
    // Lado superior
    for (let dx = -radius; dx <= radius; dx++) {
      positions.push({ x: startX + dx * gridSize, y: startY - offset });
    }
    
    // Testa cada posição
    for (const pos of positions) {
      // Garante que não saia dos limites do canvas
      const x = Math.max(pos.x, minX);
      const y = Math.max(pos.y, minY);
      
      const testRect: Rect = { x, y, width, height };
      if (!hasCollision(testRect, nodes, excludeSet, nodeIds)) {
        return { x, y, hadCollision: true };
      }
    }
  }
  
  // Fallback: retorna posição original se não encontrar livre
  // (isso não deveria acontecer em uso normal)
  return { x: startX, y: startY, hadCollision: true };
}

/**
 * Verifica se um grupo de nodes (com delta aplicado) colide com outros nodes
 */
function groupHasCollision(
  groupNodes: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  deltaX: number,
  deltaY: number,
  allNodes: Rect[],
  allNodeIds: string[]
): boolean {
  const groupIds = new Set(groupNodes.map(n => n.id));
  
  for (const groupNode of groupNodes) {
    const movedRect: Rect = {
      x: groupNode.x + deltaX,
      y: groupNode.y + deltaY,
      width: groupNode.width,
      height: groupNode.height,
    };
    
    for (let i = 0; i < allNodes.length; i++) {
      if (groupIds.has(allNodeIds[i])) continue;
      if (rectIntersects(movedRect, allNodes[i])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Encontra delta livre de colisão para um grupo de nodes (multi-seleção)
 * 
 * Testa o delta desejado e busca em espiral até encontrar um delta que
 * não cause colisão com nenhum node fora do grupo
 */
export function findFreePositionForGroup(
  targetDeltaX: number,
  targetDeltaY: number,
  groupNodes: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  allNodes: Rect[],
  allNodeIds: string[],
  gridSize: number = GRID_SIZE,
  minX: number = CANVAS_PADDING,
  minY: number = CANVAS_PADDING
): { x: number; y: number } {
  if (groupNodes.length === 0) {
    return { x: targetDeltaX, y: targetDeltaY };
  }
  
  // Snap para grid
  const startDeltaX = snapToGrid(targetDeltaX, gridSize);
  const startDeltaY = snapToGrid(targetDeltaY, gridSize);
  
  // Verifica se o delta inicial não causa colisão
  if (!groupHasCollision(groupNodes, startDeltaX, startDeltaY, allNodes, allNodeIds)) {
    // Verifica também se nenhum node ficaria fora dos limites
    let allInBounds = true;
    for (const node of groupNodes) {
      if (node.x + startDeltaX < minX || node.y + startDeltaY < minY) {
        allInBounds = false;
        break;
      }
    }
    if (allInBounds) {
      return { x: startDeltaX, y: startDeltaY };
    }
  }
  
  // Busca em espiral por um delta livre
  const maxRadius = 30; // Limite de busca
  
  for (let radius = 1; radius <= maxRadius; radius++) {
    const offset = radius * gridSize;
    
    // Gera deltas no perímetro do quadrado
    const deltas: Array<{ x: number; y: number }> = [];
    
    // Lado inferior
    for (let dx = -radius; dx <= radius; dx++) {
      deltas.push({ x: startDeltaX + dx * gridSize, y: startDeltaY + offset });
    }
    
    // Lado direito
    for (let dy = -radius; dy < radius; dy++) {
      deltas.push({ x: startDeltaX + offset, y: startDeltaY + dy * gridSize });
    }
    
    // Lado esquerdo
    for (let dy = -radius; dy < radius; dy++) {
      deltas.push({ x: startDeltaX - offset, y: startDeltaY + dy * gridSize });
    }
    
    // Lado superior
    for (let dx = -radius; dx <= radius; dx++) {
      deltas.push({ x: startDeltaX + dx * gridSize, y: startDeltaY - offset });
    }
    
    for (const delta of deltas) {
      // Verifica se todos os nodes ficariam dentro dos limites
      let allInBounds = true;
      for (const node of groupNodes) {
        if (node.x + delta.x < minX || node.y + delta.y < minY) {
          allInBounds = false;
          break;
        }
      }
      
      if (allInBounds && !groupHasCollision(groupNodes, delta.x, delta.y, allNodes, allNodeIds)) {
        return delta;
      }
    }
  }
  
  // Fallback: retorna delta original
  return { x: startDeltaX, y: startDeltaY };
}

/**
 * Limita um retângulo de desenho (draw-to-create) para não sobrepor nodes existentes
 * 
 * @param anchorX - Ponto fixo onde o usuário clicou
 * @param anchorY - Ponto fixo onde o usuário clicou
 * @param targetX - Ponto atual do mouse
 * @param targetY - Ponto atual do mouse
 * @param nodes - Nodes existentes no canvas
 * @param gridSize - Tamanho do grid para snap
 * @returns Retângulo limitado { x, y, width, height }
 */
export function constrainDrawRect(
  anchorX: number,
  anchorY: number,
  targetX: number,
  targetY: number,
  nodes: Rect[],
  gridSize: number = GRID_SIZE
): { x: number; y: number; width: number; height: number } {
  // Snap positions para grid
  const snappedAnchorX = snapToGrid(anchorX, gridSize);
  const snappedAnchorY = snapToGrid(anchorY, gridSize);
  let snappedTargetX = snapToGrid(targetX, gridSize);
  let snappedTargetY = snapToGrid(targetY, gridSize);
  
  // Calcula retângulo base (anchor é fixo, target é ajustável)
  const isGrowingRight = snappedTargetX >= snappedAnchorX;
  const isGrowingDown = snappedTargetY >= snappedAnchorY;
  
  // Itera para ajustar target até não haver colisão (máx 20 iterações)
  for (let i = 0; i < 20; i++) {
    const x = Math.min(snappedAnchorX, snappedTargetX);
    const y = Math.min(snappedAnchorY, snappedTargetY);
    const width = Math.abs(snappedTargetX - snappedAnchorX);
    const height = Math.abs(snappedTargetY - snappedAnchorY);
    
    if (width === 0 || height === 0) break;
    
    const rect: Rect = { x, y, width, height };
    
    // Encontra a primeira colisão
    let collision: Rect | null = null;
    for (const node of nodes) {
      if (rectIntersects(rect, node)) {
        collision = node;
        break;
      }
    }
    
    if (!collision) break; // Sem colisão, podemos usar este retângulo
    
    // Ajusta target para parar na borda do node que colide
    if (isGrowingRight) {
      // Crescendo para direita - para na borda esquerda do node
      if (collision.x > snappedAnchorX && snappedTargetX > collision.x) {
        snappedTargetX = collision.x;
      }
    } else {
      // Crescendo para esquerda - para na borda direita do node
      if (collision.x + collision.width < snappedAnchorX && snappedTargetX < collision.x + collision.width) {
        snappedTargetX = collision.x + collision.width;
      }
    }
    
    if (isGrowingDown) {
      // Crescendo para baixo - para na borda superior do node
      if (collision.y > snappedAnchorY && snappedTargetY > collision.y) {
        snappedTargetY = collision.y;
      }
    } else {
      // Crescendo para cima - para na borda inferior do node
      if (collision.y + collision.height < snappedAnchorY && snappedTargetY < collision.y + collision.height) {
        snappedTargetY = collision.y + collision.height;
      }
    }
  }
  
  const finalX = Math.min(snappedAnchorX, snappedTargetX);
  const finalY = Math.min(snappedAnchorY, snappedTargetY);
  const finalWidth = Math.abs(snappedTargetX - snappedAnchorX);
  const finalHeight = Math.abs(snappedTargetY - snappedAnchorY);
  
  return { x: finalX, y: finalY, width: finalWidth, height: finalHeight };
}

export type ResizeDirection = 
  | "top" | "right" | "bottom" | "left"
  | "topRight" | "bottomRight" | "bottomLeft" | "topLeft";

/**
 * Calcula os limites máximos de resize antes de colidir com outro node
 */
export function calculateResizeLimits(
  node: Rect & { id: string },
  direction: ResizeDirection,
  allNodes: Array<Rect & { id: string }>,
  gridSize: number = GRID_SIZE,
  minWidth: number = gridSize * 4,
  minHeight: number = gridSize * 2
): { maxWidth: number; maxHeight: number } {
  // Valores padrão muito grandes
  let maxWidth = 10000;
  let maxHeight = 10000;
  
  // Filtra o próprio node
  const otherNodes = allNodes.filter(n => n.id !== node.id);
  
  // Para cada direção, calcula o limite baseado nos nodes vizinhos
  for (const other of otherNodes) {
    // Expansão para direita (right, topRight, bottomRight)
    if (direction === "right" || direction === "topRight" || direction === "bottomRight") {
      // Verifica se o outro node está à direita e na mesma faixa vertical
      if (other.x > node.x) {
        const verticalOverlap = !(
          node.y + node.height <= other.y ||
          node.y >= other.y + other.height
        );
        if (verticalOverlap) {
          const possibleWidth = other.x - node.x;
          maxWidth = Math.min(maxWidth, possibleWidth);
        }
      }
    }
    
    // Expansão para baixo (bottom, bottomRight, bottomLeft)
    if (direction === "bottom" || direction === "bottomRight" || direction === "bottomLeft") {
      // Verifica se o outro node está abaixo e na mesma faixa horizontal
      if (other.y > node.y) {
        const horizontalOverlap = !(
          node.x + node.width <= other.x ||
          node.x >= other.x + other.width
        );
        if (horizontalOverlap) {
          const possibleHeight = other.y - node.y;
          maxHeight = Math.min(maxHeight, possibleHeight);
        }
      }
    }
    
    // Expansão para esquerda (left, topLeft, bottomLeft)
    if (direction === "left" || direction === "topLeft" || direction === "bottomLeft") {
      // Verifica se o outro node está à esquerda
      if (other.x + other.width < node.x + node.width) {
        const verticalOverlap = !(
          node.y + node.height <= other.y ||
          node.y >= other.y + other.height
        );
        if (verticalOverlap && other.x + other.width > node.x) {
          // Node está parcialmente à esquerda
          const possibleExpansion = node.x - (other.x + other.width);
          if (possibleExpansion > 0) {
            maxWidth = Math.min(maxWidth, node.width + possibleExpansion);
          }
        }
      }
    }
    
    // Expansão para cima (top, topRight, topLeft)
    if (direction === "top" || direction === "topRight" || direction === "topLeft") {
      // Verifica se o outro node está acima
      if (other.y + other.height < node.y + node.height) {
        const horizontalOverlap = !(
          node.x + node.width <= other.x ||
          node.x >= other.x + other.width
        );
        if (horizontalOverlap && other.y + other.height > node.y) {
          // Node está parcialmente acima
          const possibleExpansion = node.y - (other.y + other.height);
          if (possibleExpansion > 0) {
            maxHeight = Math.min(maxHeight, node.height + possibleExpansion);
          }
        }
      }
    }
  }
  
  // Snap para grid e aplica mínimos
  maxWidth = Math.max(snapToGrid(maxWidth, gridSize), minWidth);
  maxHeight = Math.max(snapToGrid(maxHeight, gridSize), minHeight);
  
  return { maxWidth, maxHeight };
}

/**
 * Verifica se um resize causaria colisão
 */
export function wouldResizeCollide(
  nodeId: string,
  newX: number,
  newY: number,
  newWidth: number,
  newHeight: number,
  allNodes: Array<Rect & { id: string }>
): boolean {
  const newRect: Rect = { x: newX, y: newY, width: newWidth, height: newHeight };
  
  for (const other of allNodes) {
    if (other.id === nodeId) continue;
    if (rectIntersects(newRect, other)) {
      return true;
    }
  }
  
  return false;
}
