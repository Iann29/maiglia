"use client";

import { useState, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { NodeHeader } from "./NodeHeader";
import { NodeContent } from "./NodeContent";
import {
  type CanvasNode as CanvasNodeType,
  type TitleAlign,
  GRID_SIZE,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  NODE_BORDER_RADIUS,
  calculateZIndex,
  snapToGrid,
} from "./canvas-types";

interface CanvasNodeProps {
  node: CanvasNodeType;
  isSelected: boolean;
  isEditing: boolean;
  isPartOfMultiSelection: boolean; // Se faz parte de uma seleção múltipla
  onSelect: (ctrlKey: boolean) => void; // Recebe ctrlKey para suportar Ctrl+Click
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (x: number, y: number, width: number, height: number) => void;
  onGroupDragStart?: () => void; // Inicia movimento em grupo
  onGroupDrag?: (deltaX: number, deltaY: number) => void; // Durante movimento em grupo
  onGroupDragEnd?: () => void; // Finaliza movimento em grupo
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (position: { x: number; y: number; nodeLeft?: number }) => void;
  bounds: string;
}

export function CanvasNode({
  node,
  isSelected,
  isEditing,
  isPartOfMultiSelection,
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
  bounds,
}: CanvasNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSize, setResizeSize] = useState({ w: node.width, h: node.height });
  
  // Ref para rastrear posição inicial do drag (para movimento em grupo)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingGroupRef = useRef(false);

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

  const zIndex = calculateZIndex(node.index) + (isSelected ? 1000 : 0);

  return (
    <Rnd
      position={{ x: node.x, y: node.y }}
      size={{ width: node.width, height: node.height }}
      bounds={bounds}
      dragGrid={[GRID_SIZE, GRID_SIZE]}
      resizeGrid={[GRID_SIZE, GRID_SIZE]}
      minWidth={MIN_NODE_WIDTH}
      minHeight={MIN_NODE_HEIGHT}
      onDragStart={(e) => {
        e.stopPropagation();
        // Passa ctrlKey para suportar Ctrl+Click na seleção
        onSelect(e.ctrlKey || e.metaKey);
        
        // Se faz parte de multi-seleção, inicia movimento em grupo
        if (isPartOfMultiSelection && onGroupDragStart) {
          dragStartPosRef.current = { x: node.x, y: node.y };
          isDraggingGroupRef.current = true;
          onGroupDragStart();
        }
      }}
      onDrag={(e, d) => {
        // Durante drag, calcula delta e notifica para mover outros nodes
        if (isDraggingGroupRef.current && dragStartPosRef.current && onGroupDrag) {
          const deltaX = d.x - dragStartPosRef.current.x;
          const deltaY = d.y - dragStartPosRef.current.y;
          onGroupDrag(deltaX, deltaY);
        }
      }}
      onDragStop={(e, d) => {
        const x = snapToGrid(d.x);
        const y = snapToGrid(d.y);
        onUpdatePosition(x, y);
        
        // Finaliza movimento em grupo
        if (isDraggingGroupRef.current && onGroupDragEnd) {
          onGroupDragEnd();
        }
        dragStartPosRef.current = null;
        isDraggingGroupRef.current = false;
      }}
      onResizeStart={() => {
        setIsResizing(true);
        setResizeSize({ w: node.width, h: node.height });
      }}
      onResize={(e, direction, ref) => {
        setResizeSize({ w: ref.offsetWidth, h: ref.offsetHeight });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setIsResizing(false);
        const x = snapToGrid(position.x);
        const y = snapToGrid(position.y);
        const width = snapToGrid(ref.offsetWidth);
        const height = snapToGrid(ref.offsetHeight);
        onUpdateSize(x, y, width, height);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        // Passa ctrlKey para suportar Ctrl+Click na seleção
        onSelect(e.ctrlKey || e.metaKey);
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
      {/* Badge de tamanho durante resize */}
      {isResizing && (
        <div className="absolute -top-8 left-0 px-2 py-1 bg-accent text-white text-xs font-bold rounded shadow-lg">
          {Math.round(resizeSize.w / GRID_SIZE)}×{Math.round(resizeSize.h / GRID_SIZE)}
        </div>
      )}

      <div
        data-node-container="true"
        className={`w-full h-full rounded-lg overflow-hidden border transition-shadow ${
          isSelected
            ? "border-accent shadow-lg shadow-accent/20"
            : "border-border-primary hover:shadow-md"
        }`}
        style={{ borderRadius: NODE_BORDER_RADIUS }}
      >
        <NodeHeader
          node={node}
          isEditing={isEditing}
          isHovered={isHovered || isSelected}
          onStartEdit={onStartEdit}
          onSaveTitle={onSaveTitle}
          onCancelEdit={onCancelEdit}
          onConfigClick={handleConfigClick}
        />
        <NodeContent height={isResizing ? resizeSize.h : node.height} />
      </div>
    </Rnd>
  );
}
