"use client";

import { useState, useCallback, useRef, memo, useMemo } from "react";
import { Rnd } from "react-rnd";
import { NodeHeader } from "./NodeHeader";
import { NodeContent } from "./NodeContent";
import {
  type CanvasNode as CanvasNodeType,
  type TitleAlign,
  GRID_SIZE,
  NODE_GAP,
  CANVAS_PADDING,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  NODE_HEADER_HEIGHT,
  NODE_BORDER_RADIUS,
  calculateZIndex,
  snapToGrid,
} from "./canvas-types";
import { getCardStyle } from "@/constants/canvas";
import {
  findFreePosition,
  wouldResizeCollide,
  type Rect,
} from "./collision";

// Altura extra quando há ícone (para acomodar emoji + título) - deve ser igual ao NodeHeader
const ICON_AREA_HEIGHT = 32;

// Nodes de imagem podem ser menores que nodes normais
const MIN_IMAGE_NODE_SIZE = 80;

interface CanvasNodeProps {
  node: CanvasNodeType;
  allNodes: CanvasNodeType[]; // Todos os nodes para detecção de colisão
  isSelected: boolean;
  isEditing: boolean;
  isPartOfMultiSelection: boolean; // Se faz parte de uma seleção múltipla
  groupDragOffset: { x: number; y: number }; // Offset visual durante group drag
  groupTargetOffset?: { x: number; y: number }; // Offset para posição alvo do grupo (ghost)
  onSelect: (ctrlKey: boolean) => void; // Recebe ctrlKey para suportar Ctrl+Click
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (x: number, y: number, width: number, height: number) => void;
  onGroupDragStart?: () => void; // Inicia movimento em grupo
  onGroupDrag?: (deltaX: number, deltaY: number) => void; // Durante movimento em grupo
  onGroupDragEnd?: (finalX: number, finalY: number) => void; // Finaliza movimento em grupo
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (position: { x: number; y: number; nodeLeft?: number }) => void;
  onIconClick?: (position: { x: number; y: number }) => void;
  onContentChange?: (content: unknown) => void;
  bounds: string;
}

// Comparador de props para React.memo - evita re-renders desnecessários
function arePropsEqual(prevProps: CanvasNodeProps, nextProps: CanvasNodeProps): boolean {
  // Compara propriedades do node individualmente (não por referência)
  const nodeEqual = 
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.x === nextProps.node.x &&
    prevProps.node.y === nextProps.node.y &&
    prevProps.node.width === nextProps.node.width &&
    prevProps.node.height === nextProps.node.height &&
    prevProps.node.color === nextProps.node.color &&
    prevProps.node.index === nextProps.node.index &&
    prevProps.node.title === nextProps.node.title &&
    prevProps.node.titleAlign === nextProps.node.titleAlign &&
    prevProps.node.type === nextProps.node.type &&
    prevProps.node.content === nextProps.node.content &&
    prevProps.node.icon === nextProps.node.icon &&
    prevProps.node.titleSize === nextProps.node.titleSize &&
    prevProps.node.style === nextProps.node.style;
  
  if (!nodeEqual) return false;
  
  // Compara outras props que afetam renderização
  if (
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.isEditing !== nextProps.isEditing ||
    prevProps.isPartOfMultiSelection !== nextProps.isPartOfMultiSelection ||
    prevProps.groupDragOffset.x !== nextProps.groupDragOffset.x ||
    prevProps.groupDragOffset.y !== nextProps.groupDragOffset.y ||
    prevProps.bounds !== nextProps.bounds
  ) {
    return false;
  }
  
  // Compara groupTargetOffset
  const prevTarget = prevProps.groupTargetOffset;
  const nextTarget = nextProps.groupTargetOffset;
  if (prevTarget !== nextTarget) {
    if (!prevTarget || !nextTarget) return false;
    if (prevTarget.x !== nextTarget.x || prevTarget.y !== nextTarget.y) return false;
  }
  
  // Compara allNodes apenas por length (otimização)
  if (prevProps.allNodes.length !== nextProps.allNodes.length) return false;
  
  return true;
  // Nota: callbacks NÃO são comparados - assumimos que mudanças em callbacks não afetam rendering visual
}

function CanvasNodeComponent({
  node,
  allNodes,
  isSelected,
  isEditing,
  isPartOfMultiSelection,
  groupDragOffset,
  groupTargetOffset,
  onSelect,
  onUpdatePosition,
  onUpdateSize,
  onGroupDragStart,
  onGroupDrag,
  onGroupDragEnd,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onConfigClick,
  onIconClick,
  onContentChange,
  bounds,
}: CanvasNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSize, setResizeSize] = useState({ w: node.width, h: node.height });
  const [resizePosition, setResizePosition] = useState({ x: node.x, y: node.y });
  
  // Estado local para posição durante drag - isola do Convex para evitar flicker
  // Quando null, usa posição do Convex. Quando definido, usa posição local.
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Posição alvo (livre de colisão) durante drag individual
  // hadCollision indica se houve colisão real (para mostrar ghost preview)
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number; hadCollision: boolean } | null>(null);
  
  // Ref para rastrear posição inicial do drag (para movimento em grupo)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingGroupRef = useRef(false);
  
  // Ref para throttle da busca de posição livre
  const lastCollisionCheckRef = useRef<number>(0);
  
  // Prepara dados de colisão (memoizado para performance)
  const collisionData = useMemo(() => {
    const rects: Rect[] = allNodes.map(n => ({
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
    }));
    const ids = allNodes.map(n => n.id);
    return { rects, ids };
  }, [allNodes]);

  const handleConfigClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const button = e.currentTarget;
      const nodeDiv = button.closest('[data-node-container="true"]');
      if (nodeDiv) {
        const rect = nodeDiv.getBoundingClientRect();
        onConfigClick({
          x: rect.right + 8,
          y: rect.top,
          nodeLeft: rect.left,
        });
      }
    },
    [onConfigClick]
  );

  const handleIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      onIconClick?.({
        x: rect.left,
        y: rect.bottom + 4,
      });
    },
    [onIconClick]
  );

  // Obtém o estilo atual do card
  const cardStyle = getCardStyle(node.style ?? 0);

  const zIndex = calculateZIndex(node.index) + (isSelected ? 1000 : 0);

  // Posição visual:
  // - Se está arrastando (dragPosition != null): usa posição local para evitar flicker
  // - Senão: usa posição do Convex + offset de group drag (para multi-seleção)
  const rndPosition = dragPosition 
    ? { x: dragPosition.x, y: dragPosition.y }
    : { x: node.x + groupDragOffset.x, y: node.y + groupDragOffset.y };

  return (
    <Rnd
      position={rndPosition}
      size={{ width: node.width, height: node.height }}
      bounds={bounds}
      dragGrid={[GRID_SIZE, GRID_SIZE]}
      resizeGrid={[GRID_SIZE, GRID_SIZE]}
      minWidth={node.type === "image" ? MIN_IMAGE_NODE_SIZE : MIN_NODE_WIDTH}
      minHeight={node.type === "image" ? MIN_IMAGE_NODE_SIZE : MIN_NODE_HEIGHT}
      onDragStart={(e) => {
        e.stopPropagation();
        // Passa shiftKey/ctrlKey para suportar Shift+Click na seleção múltipla
        onSelect(e.shiftKey || e.ctrlKey || e.metaKey);
        
        // Inicia estado local de drag para isolar do Convex (evita flicker)
        setDragPosition({ x: node.x, y: node.y });
        setTargetPosition({ x: node.x, y: node.y, hadCollision: false });
        
        // Se faz parte de multi-seleção, inicia movimento em grupo
        if (isPartOfMultiSelection && onGroupDragStart) {
          dragStartPosRef.current = { x: node.x, y: node.y };
          isDraggingGroupRef.current = true;
          onGroupDragStart();
        }
      }}
      onDrag={(e, d) => {
        // Atualiza posição local durante drag (não depende do Convex)
        setDragPosition({ x: d.x, y: d.y });
        
        // Durante drag em grupo, calcula delta e notifica para mover outros nodes
        if (isDraggingGroupRef.current && dragStartPosRef.current && onGroupDrag) {
          const deltaX = d.x - dragStartPosRef.current.x;
          const deltaY = d.y - dragStartPosRef.current.y;
          onGroupDrag(deltaX, deltaY);
        } else {
          // Node individual - calcula posição livre com throttle
          const now = Date.now();
          if (now - lastCollisionCheckRef.current > 50) {
            lastCollisionCheckRef.current = now;
            const snappedX = snapToGrid(d.x);
            const snappedY = snapToGrid(d.y);
            const freePos = findFreePosition(
              snappedX,
              snappedY,
              node.width,
              node.height,
              collisionData.rects,
              [node.id],
              collisionData.ids,
              GRID_SIZE,
              0, // minX - permitir posicionar nas bordas
              0  // minY - permitir posicionar nas bordas
            );
            setTargetPosition(freePos);
          }
        }
      }}
      onDragStop={(e, d) => {
        // Finaliza movimento em grupo - passa posição final para o handler
        if (isDraggingGroupRef.current && onGroupDragEnd) {
          // Group drag usa targetOffset calculado pelo InfiniteCanvas
          const x = snapToGrid(d.x);
          const y = snapToGrid(d.y);
          onGroupDragEnd(x, y);
        } else {
          // Node individual - faz verificação final de colisão para garantir posição correta
          const snappedX = snapToGrid(d.x);
          const snappedY = snapToGrid(d.y);
          const finalPos = findFreePosition(
            snappedX,
            snappedY,
            node.width,
            node.height,
            collisionData.rects,
            [node.id],
            collisionData.ids,
            GRID_SIZE,
            0, // minX - permitir posicionar nas bordas
            0  // minY - permitir posicionar nas bordas
          );
          onUpdatePosition(finalPos.x, finalPos.y);
        }
        
        // Limpa estado local de drag (volta a usar posição do Convex)
        // O optimistic update já terá atualizado o cache com a nova posição
        setDragPosition(null);
        setTargetPosition(null);
        
        dragStartPosRef.current = null;
        isDraggingGroupRef.current = false;
      }}
      onResizeStart={() => {
        setIsResizing(true);
        setResizeSize({ w: node.width, h: node.height });
        setResizePosition({ x: node.x, y: node.y });
      }}
      onResize={(e, direction, ref, delta, position) => {
        const newWidth = ref.offsetWidth;
        const newHeight = ref.offsetHeight;
        const newX = position.x;
        const newY = position.y;
        
        // Verifica se o novo tamanho causaria colisão
        const wouldCollide = wouldResizeCollide(
          node.id,
          newX,
          newY,
          newWidth,
          newHeight,
          allNodes.map(n => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height }))
        );
        
        // Se não colide, atualiza o tamanho visual
        if (!wouldCollide) {
          setResizeSize({ w: newWidth, h: newHeight });
          setResizePosition({ x: newX, y: newY });
        }
        // Se colide, mantém o tamanho anterior (bloqueia o resize)
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setIsResizing(false);
        // Usa as posições/tamanhos que foram validados durante o resize
        const x = snapToGrid(resizePosition.x);
        const y = snapToGrid(resizePosition.y);
        const width = snapToGrid(resizeSize.w);
        const height = snapToGrid(resizeSize.h);
        onUpdateSize(x, y, width, height);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        // Passa shiftKey/ctrlKey para suportar Shift+Click na seleção múltipla
        onSelect(e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      enableResizing={isSelected}
      style={{ zIndex }}
      resizeHandleStyles={{
        top: { cursor: "ns-resize" },
        right: { cursor: "ew-resize" },
        bottom: { cursor: "ns-resize" },
        left: { cursor: "ew-resize" },
        topRight: { cursor: "nesw-resize" },
        bottomRight: { cursor: "nwse-resize" },
        bottomLeft: { cursor: "nesw-resize" },
        topLeft: { cursor: "nwse-resize" },
      }}
      resizeHandleClasses={{
        top: "resize-handle resize-handle-edge resize-handle-top",
        right: "resize-handle resize-handle-edge resize-handle-right",
        bottom: "resize-handle resize-handle-edge resize-handle-bottom",
        left: "resize-handle resize-handle-edge resize-handle-left",
        topRight: "resize-handle resize-handle-corner resize-handle-corner-tr",
        bottomRight: "resize-handle resize-handle-corner resize-handle-corner-br",
        bottomLeft: "resize-handle resize-handle-corner resize-handle-corner-bl",
        topLeft: "resize-handle resize-handle-corner resize-handle-corner-tl",
      }}
    >
      {/* Ghost preview durante drag individual - só mostra quando há colisão real */}
      {dragPosition && targetPosition && !isDraggingGroupRef.current && 
        targetPosition.hadCollision && (
        <div
          className="node-ghost-preview"
          style={{
            position: "absolute",
            left: (targetPosition.x - dragPosition.x),
            top: (targetPosition.y - dragPosition.y),
            width: node.width - NODE_GAP * 2,
            height: node.height - NODE_GAP * 2,
            marginLeft: NODE_GAP,
            marginTop: NODE_GAP,
            borderRadius: NODE_BORDER_RADIUS,
            border: `2px dashed ${cardStyle.headerBg}`,
            backgroundColor: `${cardStyle.headerBg}25`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
      
      {/* Ghost preview para group drag (mostra posição alvo do grupo) */}
      {isPartOfMultiSelection && groupTargetOffset && groupDragOffset && 
        (groupTargetOffset.x !== groupDragOffset.x || groupTargetOffset.y !== groupDragOffset.y) && (
        <div
          className="node-ghost-preview"
          style={{
            position: "absolute",
            left: groupTargetOffset.x - groupDragOffset.x,
            top: groupTargetOffset.y - groupDragOffset.y,
            width: node.width - NODE_GAP * 2,
            height: node.height - NODE_GAP * 2,
            marginLeft: NODE_GAP,
            marginTop: NODE_GAP,
            borderRadius: NODE_BORDER_RADIUS,
            border: `2px dashed ${cardStyle.headerBg}`,
            backgroundColor: `${cardStyle.headerBg}25`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Badge de tamanho durante resize */}
      {isResizing && (
        <div className="absolute -top-8 left-0 px-2 py-1 bg-accent text-accent-fg text-xs font-bold rounded shadow-lg">
          {Math.round(resizeSize.w / GRID_SIZE)}×{Math.round(resizeSize.h / GRID_SIZE)}
        </div>
      )}

      {node.type === "image" ? (
        <div
          data-node-container="true"
          className="absolute overflow-hidden transition-all duration-200"
          style={{ 
            borderRadius: NODE_BORDER_RADIUS,
            top: NODE_GAP,
            left: NODE_GAP,
            right: NODE_GAP,
            bottom: NODE_GAP,
            border: `${cardStyle.borderWidth}px solid ${isSelected ? '#0984E3' : cardStyle.borderColor}`,
            boxShadow: isSelected 
              ? `0 0 0 3px rgba(9,132,227,0.3), ${cardStyle.shadow}` 
              : isHovered 
                ? `0 0 0 2px rgba(9,132,227,0.2), ${cardStyle.shadow}` 
                : cardStyle.shadow,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(node.content as { imageUrl?: string })?.imageUrl || ""}
            alt={node.title || "Imagem"}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <div
          data-node-container="true"
          className="absolute overflow-hidden transition-all duration-200"
          style={{ 
            borderRadius: NODE_BORDER_RADIUS,
            top: NODE_GAP,
            left: NODE_GAP,
            right: NODE_GAP,
            bottom: NODE_GAP,
            border: `${cardStyle.borderWidth}px solid ${isSelected ? '#0984E3' : cardStyle.borderColor}`,
            boxShadow: isSelected 
              ? `0 0 0 3px rgba(9,132,227,0.3), ${cardStyle.shadow}` 
              : isHovered 
                ? `0 0 0 2px rgba(9,132,227,0.2), ${cardStyle.shadow}` 
                : cardStyle.shadow,
          }}
        >
          <NodeHeader
            node={node}
            isEditing={isEditing}
            isHovered={isHovered || isSelected}
            onStartEdit={onStartEdit}
            onSaveTitle={onSaveTitle}
            onCancelEdit={onCancelEdit}
            onConfigClick={handleConfigClick}
            onIconClick={handleIconClick}
          />
          <NodeContent 
            height={(() => {
              const totalHeight = isResizing ? resizeSize.h - (NODE_GAP * 2) : node.height - (NODE_GAP * 2);
              const headerHeight = node.icon ? cardStyle.headerHeight + ICON_AREA_HEIGHT : cardStyle.headerHeight;
              return totalHeight - headerHeight;
            })()}
            type={node.type}
            style={node.style}
            content={node.content}
            onContentChange={onContentChange}
          />
        </div>
      )}
    </Rnd>
  );
}

// Exporta com React.memo para evitar re-renders quando props não mudam
export const CanvasNode = memo(CanvasNodeComponent, arePropsEqual);
