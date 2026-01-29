# Códigos Completos dos Componentes de Node - Maiglia

Este arquivo contém todos os códigos atuais dos componentes que compõem um Node no canvas do Maiglia.

---

## 1. canvas-types.ts

```typescript
/**
 * Tipos do Canvas - Maiglia
 * 
 * Este arquivo contém apenas TIPOS e funções específicas do canvas.
 * Constantes foram movidas para src/constants/canvas.ts
 */

// Re-exporta constantes do arquivo centralizado para backward compatibility
export {
  GRID_SIZE,
  NODE_GAP,
  CANVAS_PADDING,
  CANVAS_SIDE_BORDER,
  MIN_ROWS,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  NODE_HEADER_HEIGHT,
  NODE_BORDER_RADIUS,
  NODE_COLORS,
  NODE_COLORS as COLORS, // Alias para backward compatibility
  getRandomNodeColor,
  getRandomNodeColor as getRandomColor, // Alias para backward compatibility
  snapToGrid,
} from "@/constants/canvas";

export interface Point {
  x: number;
  y: number;
}

export type TitleAlign = "left" | "center" | "right";

export type TitleSize = "hidden" | "S" | "M" | "L" | "XL";

export type NodeStyle = "default" | "header-left" | "transparent" | "bordered" | "minimal" | "card";

export type NodeType = "note" | "table" | "checklist" | "image";

export interface CanvasNode {
  id: string; // clientId - identificador gerado pelo cliente
  _serverId?: string; // _id do Convex (opcional, para debug)
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  index: string; // fractional indexing para z-order
  title: string;
  titleAlign: TitleAlign;
  icon?: string; // Emoji/ícone do node (ex: "🥬")
  titleSize?: TitleSize; // Tamanho da fonte do título (default: "M")
  style?: NodeStyle; // Estilo visual do node (default: "default")
  type?: NodeType; // Tipo do node (note, table, checklist)
  content?: unknown; // Conteúdo específico do tipo
}

export function calculateZIndex(fractionalIndex: string): number {
  // Converte fractional index para número baseado na posição lexicográfica
  // Quanto maior o index (mais recente), maior o z-index
  let result = 0;
  for (let i = 0; i < Math.min(fractionalIndex.length, 10); i++) {
    result += fractionalIndex.charCodeAt(i) * Math.pow(100, 10 - i);
  }
  return Math.floor(result / 1e15); // Normaliza para range razoável
}
```

---

## 2. constants/canvas.ts

```typescript
/**
 * Constantes do Canvas - Maiglia
 * Fonte única de verdade para constantes usadas no canvas
 * 
 * NOTA: Estas constantes são duplicadas em convex/lib/constants.ts
 * porque o Convex não pode importar arquivos de src/
 */

// Grid e layout
export const GRID_SIZE = 40;
export const NODE_GAP = 4; // Gap visual entre nodes (4px de cada lado = 8px de separação)
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

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
```

---

## 3. CanvasNode.tsx

```tsx
"use client";

import { useState, useCallback, useRef, memo } from "react";
import { Rnd } from "react-rnd";
import { NodeHeader } from "./NodeHeader";
import { NodeContent } from "./NodeContent";
import {
  type CanvasNode as CanvasNodeType,
  type TitleAlign,
  GRID_SIZE,
  NODE_GAP,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  NODE_HEADER_HEIGHT,
  NODE_BORDER_RADIUS,
  calculateZIndex,
  snapToGrid,
} from "./canvas-types";

// Altura extra quando há ícone (para acomodar emoji + título) - deve ser igual ao NodeHeader
const ICON_AREA_HEIGHT = 32;

// Nodes de imagem podem ser menores que nodes normais
const MIN_IMAGE_NODE_SIZE = 80;

interface CanvasNodeProps {
  node: CanvasNodeType;
  isSelected: boolean;
  isEditing: boolean;
  isPartOfMultiSelection: boolean; // Se faz parte de uma seleção múltipla
  groupDragOffset: { x: number; y: number }; // Offset visual durante group drag
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
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isPartOfMultiSelection === nextProps.isPartOfMultiSelection &&
    prevProps.groupDragOffset.x === nextProps.groupDragOffset.x &&
    prevProps.groupDragOffset.y === nextProps.groupDragOffset.y &&
    prevProps.bounds === nextProps.bounds
  );
  // Nota: callbacks NÃO são comparados - assumimos que mudanças em callbacks não afetam rendering visual
}

function CanvasNodeComponent({
  node,
  isSelected,
  isEditing,
  isPartOfMultiSelection,
  groupDragOffset,
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
  
  // Estado local para posição durante drag - isola do Convex para evitar flicker
  // Quando null, usa posição do Convex. Quando definido, usa posição local.
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  
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
        // Passa ctrlKey para suportar Ctrl+Click na seleção
        onSelect(e.ctrlKey || e.metaKey);
        
        // Inicia estado local de drag para isolar do Convex (evita flicker)
        setDragPosition({ x: node.x, y: node.y });
        
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
        }
      }}
      onDragStop={(e, d) => {
        const x = snapToGrid(d.x);
        const y = snapToGrid(d.y);
        
        // Finaliza movimento em grupo - passa posição final para o handler
        if (isDraggingGroupRef.current && onGroupDragEnd) {
          onGroupDragEnd(x, y);
        } else {
          // Node individual - atualiza normalmente
          onUpdatePosition(x, y);
        }
        
        // Limpa estado local de drag (volta a usar posição do Convex)
        // O optimistic update já terá atualizado o cache com a nova posição
        setDragPosition(null);
        
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
        <div className="absolute -top-8 left-0 px-2 py-1 bg-accent text-accent-fg text-xs font-bold rounded shadow-lg">
          {Math.round(resizeSize.w / GRID_SIZE)}×{Math.round(resizeSize.h / GRID_SIZE)}
        </div>
      )}

      {node.type === "image" ? (
        <div
          data-node-container="true"
          className={`absolute rounded-lg overflow-hidden border transition-shadow ${
            isSelected
              ? "border-accent shadow-lg shadow-accent/20"
              : "border-border-primary hover:shadow-md"
          }`}
          style={{ 
            borderRadius: NODE_BORDER_RADIUS,
            top: NODE_GAP,
            left: NODE_GAP,
            right: NODE_GAP,
            bottom: NODE_GAP,
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
          className={`absolute rounded-lg overflow-hidden border transition-shadow ${
            isSelected
              ? "border-accent shadow-lg shadow-accent/20"
              : "border-border-primary hover:shadow-md"
          }`}
          style={{ 
            borderRadius: NODE_BORDER_RADIUS,
            top: NODE_GAP,
            left: NODE_GAP,
            right: NODE_GAP,
            bottom: NODE_GAP,
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
              const headerHeight = node.icon ? NODE_HEADER_HEIGHT + ICON_AREA_HEIGHT : NODE_HEADER_HEIGHT;
              return totalHeight - headerHeight;
            })()}
            type={node.type}
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
```

---

## 4. NodeHeader.tsx

```tsx
"use client";

import { useRef, useEffect } from "react";
import type { CanvasNode, TitleAlign, TitleSize } from "./canvas-types";
import { NODE_HEADER_HEIGHT } from "./canvas-types";

// Altura extra quando há ícone (para acomodar emoji + título)
const ICON_AREA_HEIGHT = 32;

interface NodeHeaderProps {
  node: CanvasNode;
  isEditing: boolean;
  isHovered: boolean;
  onStartEdit: () => void;
  onSaveTitle: (title: string, align: TitleAlign) => void;
  onCancelEdit: () => void;
  onConfigClick: (e: React.MouseEvent) => void;
  onIconClick?: (e: React.MouseEvent) => void;
}

export function NodeHeader({
  node,
  isEditing,
  isHovered,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onConfigClick,
  onIconClick,
}: NodeHeaderProps) {
  const hasIcon = !!node.icon;
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca no input quando entra em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.value = node.title;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isEditing, node.title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSaveTitle(e.currentTarget.value, node.titleAlign);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onSaveTitle(e.currentTarget.value, node.titleAlign);
  };

  const textAlign = node.titleAlign;
  const titleSize = node.titleSize ?? "M";
  
  // Classes de tamanho de fonte baseadas no titleSize
  const titleSizeClasses: Record<TitleSize, string> = {
    hidden: "", // Não renderiza
    S: "text-xs",
    M: "text-sm",
    L: "text-lg",
    XL: "text-xl font-bold",
  };
  
  // Altura dinâmica do header baseada na presença de ícone
  const headerHeight = hasIcon ? NODE_HEADER_HEIGHT + ICON_AREA_HEIGHT : NODE_HEADER_HEIGHT;

  return (
    <div
      className="relative flex flex-col select-none"
      style={{
        height: headerHeight,
        backgroundColor: node.color,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}
    >
      {/* Área do ícone (se existir ou hover para mostrar botão de adicionar) */}
      {(hasIcon || isHovered) && (
        <div 
          className="flex items-center justify-center pt-2 px-3"
          style={{ height: hasIcon ? ICON_AREA_HEIGHT : 0, overflow: 'hidden' }}
        >
          {hasIcon ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIconClick?.(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-2xl hover:scale-110 transition-transform cursor-pointer"
              title="Clique para mudar o ícone"
            >
              {node.icon}
            </button>
          ) : isHovered && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIconClick?.(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-white/40 hover:text-white/70 text-sm transition-colors"
              title="Adicionar ícone"
            >
              + ícone
            </button>
          )}
        </div>
      )}

      {/* Área do título */}
      {titleSize !== "hidden" && (
        <div className="flex-1 flex items-center px-3">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className={`w-full bg-transparent text-white font-semibold outline-none placeholder:text-white/50 ${titleSizeClasses[titleSize]}`}
              style={{ textAlign }}
              defaultValue={node.title}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Digite o título..."
            />
          ) : (
            <div
              className="flex-1 overflow-hidden whitespace-nowrap cursor-text"
              style={{ textAlign }}
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
            >
              {node.title ? (
                <span className={`text-white font-semibold ${titleSizeClasses[titleSize]}`}>{node.title}</span>
              ) : (
                <span className={`text-white/50 ${titleSizeClasses[titleSize]}`}>Clique para título</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Config Icon */}
      {(isHovered || isEditing) && (
        <button
          className="absolute right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors"
        style={{ 
          top: hasIcon ? ICON_AREA_HEIGHT + 8 : '50%', 
          transform: hasIcon ? 'none' : 'translateY(-50%)' 
        }}
          onClick={onConfigClick}
          onMouseDown={(e) => e.stopPropagation()}
          title="Configurações"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

---

## 5. NodeContent.tsx

```tsx
"use client";

import { NODE_BORDER_RADIUS } from "./canvas-types";
import { ChecklistContent, type ChecklistContentData } from "./content/ChecklistContent";
import type { NodeType } from "./canvas-types";

interface NodeContentProps {
  height: number;
  type?: NodeType;
  content?: unknown;
  onContentChange?: (content: unknown) => void;
}

export function NodeContent({ height, type, content, onContentChange }: NodeContentProps) {
  // Renderiza conteúdo baseado no tipo do node
  const renderContent = () => {
    switch (type) {
      case "checklist":
        return (
          <ChecklistContent
            content={content as ChecklistContentData | undefined}
            onChange={(newContent) => onContentChange?.(newContent)}
            height={height}
          />
        );
      
      case "note":
      case "table":
      default:
        // Placeholder para tipos ainda não implementados
        return (
          <div className="flex items-center justify-center text-fg-muted text-sm h-full">
            {/* Placeholder para futuro conteúdo */}
          </div>
        );
    }
  };

  return (
    <div
      className="bg-bg-primary overflow-hidden"
      style={{
        height,
        borderBottomLeftRadius: NODE_BORDER_RADIUS,
        borderBottomRightRadius: NODE_BORDER_RADIUS,
      }}
    >
      {renderContent()}
    </div>
  );
}
```

---

## 6. ChecklistContent.tsx

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Tipo para item de checklist
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// Tipo do content de checklist
export interface ChecklistContentData {
  items: ChecklistItem[];
}

interface ChecklistContentProps {
  content: ChecklistContentData | undefined;
  onChange: (content: ChecklistContentData) => void;
  height: number;
}

// Ícone de grip (6 pontos) para drag handle
function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}

// Componente sortable para cada item
interface SortableItemProps {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, item: ChecklistItem) => void;
  onRemove: (id: string) => void;
  setItemRef: (id: string, el: HTMLInputElement | null) => void;
  canRemove: boolean;
}

function SortableItem({
  item,
  onToggle,
  onTextChange,
  onKeyDown,
  onRemove,
  setItemRef,
  canRemove,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 py-1 group"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="w-5 h-5 flex items-center justify-center text-fg-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.checked
            ? "bg-accent border-accent"
            : "border-border-primary hover:border-accent"
        }`}
      >
        {item.checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Texto do item */}
      <input
        ref={(el) => setItemRef(item.id, el)}
        type="text"
        value={item.text}
        onChange={(e) => onTextChange(item.id, e.target.value)}
        onKeyDown={(e) => onKeyDown(e, item)}
        placeholder="Novo item..."
        className={`flex-1 bg-transparent outline-none text-sm transition-colors ${
          item.checked ? "text-fg-muted line-through" : "text-fg-primary"
        } placeholder:text-fg-muted/50`}
      />

      {/* Botão de remover (visível no hover) */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-5 h-5 flex items-center justify-center text-fg-muted hover:text-fg-primary opacity-0 group-hover:opacity-100 transition-opacity"
          tabIndex={-1}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ChecklistContent({ content, onChange, height }: ChecklistContentProps) {
  // Estado local para items (sincroniza com content via useEffect)
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    content?.items ?? [{ id: crypto.randomUUID(), text: "", checked: false }]
  );

  // Ref para o item que deve receber foco após render
  const focusItemIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa arrastar 8px para ativar (evita conflito com click)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincroniza state local quando content externo muda
  useEffect(() => {
    if (content?.items) {
      setItems(content.items);
    }
  }, [content]);

  // Foca no item correto após render
  useEffect(() => {
    if (focusItemIdRef.current) {
      const input = itemRefs.current.get(focusItemIdRef.current);
      if (input) {
        input.focus();
        // Posiciona cursor no final
        input.setSelectionRange(input.value.length, input.value.length);
      }
      focusItemIdRef.current = null;
    }
  });

  // Salva alterações no parent
  const saveChanges = useCallback(
    (newItems: ChecklistItem[]) => {
      onChange({ items: newItems });
    },
    [onChange]
  );

  // Handle drag end - reordena items
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((prev) => {
          const oldIndex = prev.findIndex((item) => item.id === active.id);
          const newIndex = prev.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(prev, oldIndex, newIndex);
          saveChanges(newItems);
          return newItems;
        });
      }
    },
    [saveChanges]
  );

  // Toggle checkbox
  const handleToggle = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        saveChanges(newItems);
        return newItems;
      });
    },
    [saveChanges]
  );

  // Atualiza texto do item
  const handleTextChange = useCallback(
    (itemId: string, text: string) => {
      setItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === itemId ? { ...item, text } : item
        );
        saveChanges(newItems);
        return newItems;
      });
    },
    [saveChanges]
  );

  // Adiciona novo item
  const addItem = useCallback(
    (afterItemId?: string) => {
      const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: "",
        checked: false,
      };

      setItems((prev) => {
        let newItems: ChecklistItem[];
        if (afterItemId) {
          const index = prev.findIndex((item) => item.id === afterItemId);
          newItems = [...prev.slice(0, index + 1), newItem, ...prev.slice(index + 1)];
        } else {
          newItems = [...prev, newItem];
        }
        saveChanges(newItems);
        return newItems;
      });

      focusItemIdRef.current = newItem.id;
    },
    [saveChanges]
  );

  // Remove item
  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        if (prev.length <= 1) return prev; // Mantém pelo menos 1 item

        const index = prev.findIndex((item) => item.id === itemId);
        const newItems = prev.filter((item) => item.id !== itemId);
        saveChanges(newItems);

        // Foca no item anterior ou próximo
        if (index > 0) {
          focusItemIdRef.current = newItems[index - 1].id;
        } else if (newItems.length > 0) {
          focusItemIdRef.current = newItems[0].id;
        }

        return newItems;
      });
    },
    [saveChanges]
  );

  // Handler de teclado para Enter e Backspace
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, item: ChecklistItem) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addItem(item.id);
      } else if (e.key === "Backspace" && item.text === "") {
        e.preventDefault();
        removeItem(item.id);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const index = items.findIndex((i) => i.id === item.id);
        if (index < items.length - 1) {
          focusItemIdRef.current = items[index + 1].id;
          setItems([...items]); // Força re-render
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const index = items.findIndex((i) => i.id === item.id);
        if (index > 0) {
          focusItemIdRef.current = items[index - 1].id;
          setItems([...items]); // Força re-render
        }
      }
    },
    [addItem, removeItem, items]
  );

  // Registra ref do input
  const setItemRef = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  return (
    <div
      className="flex flex-col overflow-y-auto px-3 py-2"
      style={{ height }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onRemove={removeItem}
              setItemRef={setItemRef}
              canRemove={items.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Botão para adicionar novo item */}
      <button
        type="button"
        onClick={() => addItem()}
        className="flex items-center gap-2 py-1.5 text-fg-muted hover:text-fg-primary text-sm transition-colors ml-6"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <span>Adicionar item</span>
      </button>
    </div>
  );
}
```

---

## 7. NodeSettingsPanel.tsx (ATUAL)

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { getNodeColorsFromTheme } from "@/constants/canvas";
import type { TitleSize } from "./canvas-types";

interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { x: number; y: number; nodeLeft?: number };
  nodeId: string;
  currentIcon?: string;
  currentColor: string;
  currentTitleSize: TitleSize;
  onClose: () => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onColorChange: (color: string) => void;
  onTitleSizeChange: (size: TitleSize) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TITLE_SIZES: { value: TitleSize; label: string }[] = [
  { value: "hidden", label: "X" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
];

export function NodeSettingsPanel({
  isOpen,
  position,
  nodeId,
  currentIcon,
  currentColor,
  currentTitleSize,
  onClose,
  onIconClick,
  onRemoveIcon,
  onColorChange,
  onTitleSizeChange,
  onDelete,
  onDuplicate,
}: NodeSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const colors = getNodeColorsFromTheme();

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Delay para evitar fechar imediatamente ao abrir
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleIconOptionClick = useCallback(
    (option: "remove" | "emoji" | "image" | "icon") => {
      if (option === "remove") {
        onRemoveIcon();
      } else if (option === "emoji") {
        onIconClick();
      }
      // image e icon são placeholders desabilitados por enquanto
    },
    [onRemoveIcon, onIconClick]
  );

  if (!isOpen) return null;

  // Calcula posição do painel
  const panelWidth = 240;
  const panelX =
    position.x + panelWidth > window.innerWidth && position.nodeLeft
      ? position.nodeLeft - panelWidth - 8
      : position.x;

  return (
    <div
      ref={panelRef}
      className="fixed z-[10000] bg-bg-primary border border-border-primary rounded-xl shadow-xl"
      style={{
        left: panelX,
        top: position.y,
        width: panelWidth,
      }}
    >
      {/* Seção: Ícone */}
      <div className="p-3 border-b border-border-secondary">
        <div className="text-xs text-fg-muted font-medium mb-2">Ícone</div>
        <div className="flex gap-2">
          {/* Sem ícone */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("remove")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              !currentIcon
                ? "bg-accent text-accent-fg"
                : "bg-bg-secondary text-fg-secondary hover:bg-bg-tertiary"
            }`}
            title="Sem ícone"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Emoji */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("emoji")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              currentIcon
                ? "bg-accent text-accent-fg"
                : "bg-bg-secondary text-fg-secondary hover:bg-bg-tertiary"
            }`}
            title="Escolher emoji"
          >
            {currentIcon || "😀"}
          </button>

          {/* Imagem (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg-secondary text-fg-muted opacity-50 cursor-not-allowed"
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Ícone da biblioteca (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg-secondary text-fg-muted opacity-50 cursor-not-allowed"
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção: Título */}
      <div className="p-3 border-b border-border-secondary">
        <div className="text-xs text-fg-muted font-medium mb-2">Título</div>
        <div className="flex gap-1">
          {TITLE_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => onTitleSizeChange(size.value)}
              className={`flex-1 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                currentTitleSize === size.value
                  ? "bg-accent text-accent-fg"
                  : "bg-bg-secondary text-fg-secondary hover:bg-bg-tertiary"
              }`}
              title={size.value === "hidden" ? "Ocultar título" : `Tamanho ${size.label}`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seção: Cor */}
      <div className="p-3 border-b border-border-secondary">
        <div className="text-xs text-fg-muted font-medium mb-2">Cor</div>
        <div className="grid grid-cols-8 gap-1.5">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorChange(color)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                currentColor === color ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-primary" : ""
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Seção: Ações */}
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-fg-primary hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Duplicar
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full px-3 py-2 flex items-center gap-2 text-sm text-error hover:bg-error-bg rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Deletar
        </button>
      </div>
    </div>
  );
}
```

---

## 8. NodeSettingsPanel.tsx (NOVO - docs/NodeSettingsPanel.tsx)

Este é o componente perfeito criado pelo agente, igual ao xTiles:

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TitleSize } from "./canvas-types";

interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { x: number; y: number; nodeLeft?: number };
  nodeId: string;
  currentIcon?: string;
  currentColor: string;
  currentTitleSize: TitleSize;
  currentStyle?: number;
  onClose: () => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onColorChange: (color: string) => void;
  onTitleSizeChange: (size: TitleSize) => void;
  onStyleChange?: (style: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TITLE_SIZES: { value: TitleSize; label: string }[] = [
  { value: "hidden", label: "X" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
];

// Paleta de cores do xTiles (16 cores)
const COLORS = [
  // Linha 1
  "#FF6B6B", // Vermelho coral
  "#FFB347", // Laranja
  "#FFD93D", // Amarelo
  "#6BCB77", // Verde
  "#4D96FF", // Azul
  "#9B59B6", // Roxo
  "#FF9FF3", // Rosa
  "#A8E6CF", // Menta
  // Linha 2
  "#FF8B94", // Rosa claro
  "#FFC93C", // Amarelo ouro
  "#C7F464", // Verde lima
  "#4ECDC4", // Turquesa
  "#5D8AA8", // Azul aço
  "#DDA0DD", // Lilás
  "#F8F8F8", // Branco
  "#2D3436", // Preto/cinza escuro
];

// Estilos de cards (9 variações)
const CARD_STYLES = [
  { id: 0, bg: "#2D3436", header: "#0984E3" },      // Escuro com header azul
  { id: 1, bg: "#2D3436", header: "#636E72" },      // Escuro com header cinza
  { id: 2, bg: "#74B9FF", header: "#0984E3" },      // Azul claro com header azul
  { id: 3, bg: "#2D3436", header: "#2D3436" },      // Todo escuro
  { id: 4, bg: "#636E72", header: "#2D3436" },      // Cinza com header escuro
  { id: 5, bg: "#74B9FF", header: "#FFFFFF" },      // Azul claro com header branco
  { id: 6, bg: "#A8E6CF", header: "#FFFFFF" },      // Menta com header branco
  { id: 7, bg: "#0984E3", header: "#FFFFFF" },      // Azul com header branco
  { id: 8, bg: "#74B9FF", header: "#0984E3" },      // Azul claro com header azul (variação)
];

// Componente de checkmark no canto
const SelectionCheck = () => (
  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0984E3] rounded-full flex items-center justify-center">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
);

export function NodeSettingsPanel({
  isOpen,
  position,
  nodeId,
  currentIcon,
  currentColor,
  currentTitleSize,
  currentStyle = 0,
  onClose,
  onIconClick,
  onRemoveIcon,
  onColorChange,
  onTitleSizeChange,
  onStyleChange,
  onDelete,
  onDuplicate,
}: NodeSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleIconOptionClick = useCallback(
    (option: "remove" | "emoji" | "image" | "icon") => {
      if (option === "remove") {
        onRemoveIcon();
      } else if (option === "emoji") {
        onIconClick();
      }
    },
    [onRemoveIcon, onIconClick]
  );

  if (!isOpen) return null;

  const panelWidth = 280;
  const panelX =
    position.x + panelWidth > window.innerWidth && position.nodeLeft
      ? position.nodeLeft - panelWidth - 8
      : position.x;

  return (
    <div
      ref={panelRef}
      className="fixed z-[10000] bg-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden"
      style={{
        left: panelX,
        top: position.y,
        width: panelWidth,
      }}
    >
      {/* Seção: Ícone */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Ícone</div>
        <div className="flex gap-3">
          {/* Sem ícone */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("remove")}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: !currentIcon ? "#2D3436" : "transparent",
              border: !currentIcon ? "2px solid #0984E3" : "2px solid #444444",
            }}
            title="Sem ícone"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {!currentIcon && <SelectionCheck />}
          </button>

          {/* Emoji */}
          <button
            type="button"
            onClick={() => handleIconOptionClick("emoji")}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-all text-lg"
            style={{
              backgroundColor: currentIcon ? "#2D3436" : "transparent",
              border: currentIcon ? "2px solid #0984E3" : "2px solid #444444",
            }}
            title="Escolher emoji"
          >
            {currentIcon || "😀"}
            {currentIcon && <SelectionCheck />}
          </button>

          {/* Imagem (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-lg flex items-center justify-center opacity-40 cursor-not-allowed"
            style={{ border: "2px solid #444444" }}
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Ícone da biblioteca (desabilitado) */}
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-lg flex items-center justify-center opacity-40 cursor-not-allowed"
            style={{ border: "2px solid #444444" }}
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Seção: Título */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Título</div>
        <div className="flex gap-2">
          {TITLE_SIZES.map((size) => {
            const isSelected = currentTitleSize === size.value;
            return (
              <button
                key={size.value}
                type="button"
                onClick={() => onTitleSizeChange(size.value)}
                className="relative flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  backgroundColor: isSelected ? "#2D3436" : "transparent",
                  border: isSelected ? "2px solid #0984E3" : "2px solid #444444",
                  color: isSelected ? "#FFFFFF" : "#888888",
                }}
                title={size.value === "hidden" ? "Ocultar título" : `Tamanho ${size.label}`}
              >
                {size.label}
                {isSelected && <SelectionCheck />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Estilo */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Estilo</div>
        <div className="grid grid-cols-3 gap-2">
          {CARD_STYLES.map((style) => {
            const isSelected = currentStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onStyleChange?.(style.id)}
                className="relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all hover:scale-105"
                style={{
                  border: isSelected ? "2px solid #0984E3" : "2px solid #444444",
                }}
              >
                {/* Header do card */}
                <div 
                  className="h-1/3 w-full"
                  style={{ backgroundColor: style.header }}
                />
                {/* Body do card */}
                <div 
                  className="h-2/3 w-full"
                  style={{ backgroundColor: style.bg }}
                />
                {/* Linhas simulando conteúdo */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <div 
                    className="h-1 rounded"
                    style={{ backgroundColor: style.header === "#FFFFFF" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)", width: "80%" }}
                  />
                  <div 
                    className="h-1 rounded"
                    style={{ backgroundColor: style.header === "#FFFFFF" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)", width: "60%" }}
                  />
                </div>
                {isSelected && <SelectionCheck />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção: Cor */}
      <div className="p-4 border-b border-[#333333]">
        <div className="text-xs text-[#888888] font-medium mb-3">Cor</div>
        <div className="grid grid-cols-8 gap-2">
          {COLORS.map((color) => {
            const isSelected = currentColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className="relative w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{ 
                  backgroundColor: color,
                  boxShadow: isSelected ? "0 0 0 2px #1E1E1E, 0 0 0 4px #0984E3" : "none",
                }}
                title={color}
              />
            );
          })}
        </div>
        
        {/* Cores personalizadas */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#888888]">Cores personalizadas</span>
          <button
            type="button"
            className="px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ backgroundColor: "#0984E3", color: "#FFFFFF" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Plus
          </button>
        </div>
        
        {/* Botão de adicionar cor */}
        <button
          type="button"
          className="mt-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ 
            background: "linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Seção: Ações */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full px-3 py-2.5 flex items-center gap-3 text-sm rounded-lg transition-colors hover:bg-[#2D3436]"
          style={{ color: "#FFFFFF" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Duplicar
        </button>
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full px-3 py-2.5 flex items-center gap-3 text-sm rounded-lg transition-colors hover:bg-[#2D3436]"
          style={{ color: "#FF6B6B" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Deletar
        </button>
      </div>
    </div>
  );
}
```

---

## Resumo das Interfaces

| Componente | Props Principais |
|------------|------------------|
| `CanvasNode` | `node`, `isSelected`, `isEditing`, `onSelect`, `onUpdatePosition`, `onUpdateSize`, `onConfigClick`, `onIconClick` |
| `NodeHeader` | `node`, `isEditing`, `isHovered`, `onStartEdit`, `onSaveTitle`, `onConfigClick`, `onIconClick` |
| `NodeContent` | `height`, `type`, `content`, `onContentChange` |
| `ChecklistContent` | `content`, `onChange`, `height` |
| `NodeSettingsPanel` | `isOpen`, `position`, `currentIcon`, `currentColor`, `currentTitleSize`, `currentStyle`, `onClose`, `onColorChange`, `onTitleSizeChange`, `onStyleChange` |

---

## CSS Variables Usadas

```css
--bg-primary      /* Fundo principal */
--bg-secondary    /* Fundo secundário */
--bg-tertiary     /* Fundo terciário */
--fg-primary      /* Texto principal */
--fg-secondary    /* Texto secundário */
--fg-muted        /* Texto suave */
--border-primary  /* Borda principal */
--border-secondary /* Borda secundária */
--accent          /* Cor de destaque */
--accent-fg       /* Texto sobre accent */
--error           /* Cor de erro */
--error-bg        /* Fundo de erro */
--node-color-1 até --node-color-8  /* Cores de nodes */
```
