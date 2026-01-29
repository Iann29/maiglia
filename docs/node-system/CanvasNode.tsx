"use client";

import { useState, useCallback, useRef, memo } from "react";
import { NodeHeader } from "./NodeHeader";
import { NodeContent } from "./NodeContent";
import {
  type CanvasNode as CanvasNodeType,
  type TitleAlign,
  type NodeStyle,
} from "./canvas-types";
import {
  GRID_SIZE,
  NODE_GAP,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  NODE_BORDER_RADIUS,
  getCardStyle,
  snapToGrid,
} from "./constants";

// Altura extra quando há ícone
const ICON_AREA_HEIGHT = 32;

interface CanvasNodeProps {
  node: CanvasNodeType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (ctrlKey: boolean) => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (x: number, y: number, width: number, height: number) => void;
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (position: { x: number; y: number; nodeLeft?: number }) => void;
  onIconClick?: (position: { x: number; y: number }) => void;
  onStyleChange?: (style: NodeStyle) => void;
}

function CanvasNodeComponent({
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
  onIconClick,
}: CanvasNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSize, setResizeSize] = useState({ w: node.width, h: node.height });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  
  const nodeRef = useRef<HTMLDivElement>(null);

  // Obtém o estilo atual
  const styleId = (node.style ?? 0) as NodeStyle;
  const cardStyle = getCardStyle(styleId);

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

  // Calcula altura do header baseada no estilo e ícone
  const headerHeight = node.icon 
    ? cardStyle.headerHeight + ICON_AREA_HEIGHT 
    : cardStyle.headerHeight;
  
  const contentHeight = (isResizing ? resizeSize.h : node.height) - (NODE_GAP * 2) - headerHeight;

  // Posição visual
  const displayPosition = dragPosition 
    ? { x: dragPosition.x, y: dragPosition.y }
    : { x: node.x, y: node.y };

  return (
    <div
      ref={nodeRef}
      className="absolute"
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
        width: isResizing ? resizeSize.w : node.width,
        height: isResizing ? resizeSize.h : node.height,
        zIndex: isSelected ? 100 : isHovered ? 50 : 1,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(e.ctrlKey || e.metaKey);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge de tamanho durante resize */}
      {isResizing && (
        <div 
          className="absolute -top-8 left-0 px-2 py-1 text-xs font-bold rounded shadow-lg"
          style={{ backgroundColor: '#0984E3', color: 'white' }}
        >
          {Math.round(resizeSize.w / GRID_SIZE)}×{Math.round(resizeSize.h / GRID_SIZE)}
        </div>
      )}

      {/* Container do Node */}
      <div
        data-node-container="true"
        className="absolute rounded-xl overflow-hidden transition-all duration-200"
        style={{ 
          top: NODE_GAP,
          left: NODE_GAP,
          right: NODE_GAP,
          bottom: NODE_GAP,
          borderRadius: NODE_BORDER_RADIUS,
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
          isHovered={isHovered}
          isSelected={isSelected}
          onStartEdit={onStartEdit}
          onSaveTitle={onSaveTitle}
          onCancelEdit={onCancelEdit}
          onConfigClick={handleConfigClick}
          onIconClick={handleIconClick}
        />
        <NodeContent 
          node={node}
          height={contentHeight}
        />
      </div>

      {/* Resize Handles (visíveis quando selecionado) */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div 
            className="absolute w-3 h-3 bg-white border-2 border-[#0984E3] rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
            style={{ bottom: -4, right: -4 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              const startX = e.clientX;
              const startY = e.clientY;
              const startW = node.width;
              const startH = node.height;
              
              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const newW = Math.max(MIN_NODE_WIDTH, startW + deltaX);
                const newH = Math.max(MIN_NODE_HEIGHT, startH + deltaY);
                setResizeSize({ w: newW, h: newH });
              };
              
              const handleMouseUp = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const finalW = snapToGrid(Math.max(MIN_NODE_WIDTH, node.width + deltaX));
                const finalH = snapToGrid(Math.max(MIN_NODE_HEIGHT, node.height + deltaY));
                onUpdateSize(node.x, node.y, finalW, finalH);
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </>
      )}
    </div>
  );
}

export const CanvasNode = memo(CanvasNodeComponent);
