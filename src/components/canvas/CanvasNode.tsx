"use client";

import { useState, useCallback } from "react";
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
  onSelect: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (x: number, y: number, width: number, height: number) => void;
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (position: { x: number; y: number }) => void;
  bounds: string;
}

export function CanvasNode({
  node,
  isSelected,
  isEditing,
  onSelect,
  onUpdatePosition,
  onUpdateSize,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onConfigClick,
  bounds,
}: CanvasNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleConfigClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      onConfigClick({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
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
        onSelect();
      }}
      onDragStop={(e, d) => {
        const x = snapToGrid(d.x);
        const y = snapToGrid(d.y);
        onUpdatePosition(x, y);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const x = snapToGrid(position.x);
        const y = snapToGrid(position.y);
        const width = snapToGrid(ref.offsetWidth);
        const height = snapToGrid(ref.offsetHeight);
        onUpdateSize(x, y, width, height);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
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
        top: "resize-handle resize-handle-top",
        right: "resize-handle resize-handle-right",
        bottom: "resize-handle resize-handle-bottom",
        left: "resize-handle resize-handle-left",
        topRight: "resize-handle resize-handle-corner",
        bottomRight: "resize-handle resize-handle-corner",
        bottomLeft: "resize-handle resize-handle-corner",
        topLeft: "resize-handle resize-handle-corner",
      }}
    >
      <div
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
        <NodeContent height={node.height} />
      </div>
    </Rnd>
  );
}
