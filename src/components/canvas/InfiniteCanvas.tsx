"use client";

import { useCallback, useEffect, useRef, useMemo, useState, useContext, createContext } from "react";
import { generateKeyBetween } from "fractional-indexing";
import { CanvasNode } from "./CanvasNode";
import { ContextMenu } from "./ContextMenu";
import { useCanvasStore } from "./useCanvasStore";
import {
  GRID_SIZE,
  CANVAS_PADDING,
  CANVAS_SIDE_BORDER,
  getRandomColor,
  snapToGrid,
  type CanvasNode as CanvasNodeType,
} from "./canvas-types";

// Interface para o retângulo de seleção (marquee)
interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// Header (56px) + WorkspaceTabs (40px) = 96px
const HEADER_HEIGHT = 96;

// Verifica se um node intersecta com o retângulo de seleção
function nodeIntersectsBox(node: CanvasNodeType, box: SelectionBox): boolean {
  const boxLeft = Math.min(box.startX, box.currentX);
  const boxRight = Math.max(box.startX, box.currentX);
  const boxTop = Math.min(box.startY, box.currentY);
  const boxBottom = Math.max(box.startY, box.currentY);

  const nodeRight = node.x + node.width;
  const nodeBottom = node.y + node.height;

  // Verifica se há intersecção (AABB collision)
  return (
    node.x < boxRight &&
    nodeRight > boxLeft &&
    node.y < boxBottom &&
    nodeBottom > boxTop
  );
}

// Ordena nodes por index para calcular z-order
function sortNodesByIndex(nodes: CanvasNodeType[]): CanvasNodeType[] {
  return [...nodes].sort((a, b) => a.index.localeCompare(b.index));
}

// Context para receber funções do useNodes (que persistem no Convex)
// NOTA: Todas as funções usam clientId como identificador (não _id do Convex)
interface CanvasContextType {
  nodes: CanvasNodeType[];
  deleteNode?: (clientId: string) => Promise<void>;
  deleteNodes?: (clientIds: string[]) => Promise<void>;
  updateNodeImmediate?: (clientId: string, updates: Partial<CanvasNodeType>) => Promise<void>;
  updateNodes?: (updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number }>) => Promise<void>;
  duplicateNode?: (clientId: string) => Promise<unknown>;
  reorderNode?: (clientId: string, newIndex: string) => Promise<void>;
}
export const CanvasContext = createContext<CanvasContextType>({ nodes: [] });

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const didMarqueeRef = useRef(false);
  
  // Estado para movimento em grupo (usa state para trigger re-renders durante drag)
  const [groupDragState, setGroupDragState] = useState<{
    draggedNodeId: string;
    delta: { x: number; y: number };
    startPositions: Map<string, { x: number; y: number }>;
  } | null>(null);
  
  // Funções e dados do useNodes (passados via context)
  const { 
    nodes, 
    deleteNode, 
    deleteNodes,
    updateNodeImmediate, 
    updateNodes,
    duplicateNode,
    reorderNode,
  } = useContext(CanvasContext);

  const {
    selectedNodeIds,
    editingNodeId,
    configMenu,
    selectNode,
    selectNodes,
    toggleNodeSelection,
    clearSelection,
    startEditingTitle,
    stopEditingTitle,
    openConfigMenu,
    closeConfigMenu,
    setContainerSize,
    removeFromSelection,
  } = useCanvasStore();

  // Calcular altura do canvas baseada nos nodes
  const canvasHeight = useMemo(() => {
    if (viewportHeight === 0) return "100%";
    if (nodes.length === 0) return viewportHeight;
    const maxY = Math.max(...nodes.map((n) => n.y + n.height));
    return Math.max(maxY + CANVAS_PADDING * 3, viewportHeight);
  }, [nodes, viewportHeight]);

  // Atualizar tamanho do container e viewport
  useEffect(() => {
    const updateSize = () => {
      const availableHeight = window.innerHeight - HEADER_HEIGHT;
      setViewportHeight(availableHeight);
      if (canvasAreaRef.current) {
        setContainerSize(canvasAreaRef.current.clientWidth, availableHeight);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [setContainerSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement;
        if (!isInput && selectedNodeIds.length > 0) {
          // Deleta todos os nodes selecionados de uma vez (batch)
          if (deleteNodes && selectedNodeIds.length > 1) {
            deleteNodes(selectedNodeIds);
            removeFromSelection(selectedNodeIds);
          } else if (deleteNode && selectedNodeIds.length === 1) {
            deleteNode(selectedNodeIds[0]);
            removeFromSelection(selectedNodeIds);
          }
        }
      } else if (e.key === "Escape") {
        clearSelection();
        closeConfigMenu();
        setSelectionBox(null);
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        // Ctrl+A ou Cmd+A - seleciona todos os nodes
        e.preventDefault();
        const allNodeIds = nodes.map((node) => node.id);
        if (allNodeIds.length > 0) {
          selectNodes(allNodeIds);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, deleteNode, deleteNodes, clearSelection, closeConfigMenu, nodes, selectNodes, removeFromSelection]);

  // Marquee selection handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Só inicia seleção se clicar no background do canvas
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackground) {
        const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const x = e.clientX - canvasRect.left + (canvasAreaRef.current?.scrollLeft ?? 0);
        const y = e.clientY - canvasRect.top + (canvasAreaRef.current?.scrollTop ?? 0);

        setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
        
        if (!e.ctrlKey && !e.metaKey) {
          clearSelection();
        }
        closeConfigMenu();
      }
    },
    [clearSelection, closeConfigMenu]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!selectionBox) return;

      const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const x = e.clientX - canvasRect.left + (canvasAreaRef.current?.scrollLeft ?? 0);
      const y = e.clientY - canvasRect.top + (canvasAreaRef.current?.scrollTop ?? 0);

      const newBox = { ...selectionBox, currentX: x, currentY: y };
      setSelectionBox(newBox);

      // Atualiza seleção em tempo real
      const intersectingIds = nodes
        .filter((node) => nodeIntersectsBox(node, newBox))
        .map((node) => node.id);
      
      selectNodes(intersectingIds);
    },
    [selectionBox, nodes, selectNodes]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (selectionBox) {
      const width = Math.abs(selectionBox.currentX - selectionBox.startX);
      const height = Math.abs(selectionBox.currentY - selectionBox.startY);
      if (width > 5 || height > 5) {
        didMarqueeRef.current = true;
      }
    }
    setSelectionBox(null);
  }, [selectionBox]);

  // Click fora dos nodes para deselecionar
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (didMarqueeRef.current) {
        didMarqueeRef.current = false;
        return;
      }
      
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackground) {
        clearSelection();
        closeConfigMenu();
      }
    },
    [clearSelection, closeConfigMenu]
  );

  // === Handlers para movimento em grupo ===
  
  const handleGroupDragStart = useCallback(
    (draggedNodeId: string) => {
      const { selectedNodeIds: currentSelectedIds } = useCanvasStore.getState();
      
      // Cria mapa com posições iniciais de todos os nodes selecionados
      const startPositions = new Map<string, { x: number; y: number }>();
      nodes.forEach((node) => {
        if (currentSelectedIds.includes(node.id)) {
          startPositions.set(node.id, { x: node.x, y: node.y });
        }
      });
      
      setGroupDragState({
        draggedNodeId,
        delta: { x: 0, y: 0 },
        startPositions,
      });
    },
    [nodes]
  );

  const handleGroupDrag = useCallback(
    (draggedNodeId: string, deltaX: number, deltaY: number) => {
      // Atualiza o delta no state para trigger re-render e mover nodes visualmente
      setGroupDragState((prev) => {
        if (!prev) return prev;
        return { ...prev, delta: { x: deltaX, y: deltaY } };
      });
    },
    []
  );

  const handleGroupDragEnd = useCallback(
    (draggedNodeId: string, finalX: number, finalY: number) => {
      if (!groupDragState) return;
      
      const finalDelta = groupDragState.delta;
      
      // Prepara updates para todos os nodes do grupo (exceto o que foi arrastado diretamente)
      const updates: Array<{ id: string; x: number; y: number }> = [];
      
      groupDragState.startPositions.forEach((startPos, nodeId) => {
        if (nodeId !== draggedNodeId) {
          const finalNodeX = snapToGrid(startPos.x + finalDelta.x);
          const finalNodeY = snapToGrid(startPos.y + finalDelta.y);
          updates.push({ id: nodeId, x: finalNodeX, y: finalNodeY });
        }
      });

      // Atualiza o node arrastado diretamente
      if (updateNodeImmediate) {
        updateNodeImmediate(draggedNodeId, { x: finalX, y: finalY });
      }

      // Atualiza os outros nodes do grupo em batch
      if (updates.length > 0 && updateNodes) {
        updateNodes(updates);
      }

      // Limpa o estado de group drag
      setGroupDragState(null);
    },
    [groupDragState, updateNodeImmediate, updateNodes]
  );

  // Handlers para operações de node individuais
  // Usa updateNodeImmediate para posição (optimistic update imediato, sem debounce)
  const handleUpdatePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { x, y });
      }
    },
    [updateNodeImmediate]
  );

  // Usa updateNodeImmediate para resize também (optimistic update imediato)
  const handleUpdateSize = useCallback(
    (nodeId: string, x: number, y: number, width: number, height: number) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { x, y, width, height });
      }
    },
    [updateNodeImmediate]
  );

  const handleSaveTitle = useCallback(
    (nodeId: string, title: string, align?: "left" | "center" | "right") => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { title, titleAlign: align });
      }
      stopEditingTitle();
    },
    [updateNodeImmediate, stopEditingTitle]
  );

  // Handlers para layers (reordenação de z-index)
  const handleBringToFront = useCallback(
    (nodeId: string) => {
      if (!reorderNode) return;
      const sorted = sortNodesByIndex(nodes);
      const topIndex = sorted[sorted.length - 1]?.index;
      if (!topIndex) return;
      
      const node = nodes.find(n => n.id === nodeId);
      if (node?.index === topIndex) return;
      
      const newIndex = generateKeyBetween(topIndex, null);
      reorderNode(nodeId, newIndex);
    },
    [nodes, reorderNode]
  );

  const handleSendToBack = useCallback(
    (nodeId: string) => {
      if (!reorderNode) return;
      const sorted = sortNodesByIndex(nodes);
      const bottomIndex = sorted[0]?.index;
      if (!bottomIndex) return;
      
      const node = nodes.find(n => n.id === nodeId);
      if (node?.index === bottomIndex) return;
      
      const newIndex = generateKeyBetween(null, bottomIndex);
      reorderNode(nodeId, newIndex);
    },
    [nodes, reorderNode]
  );

  const handleBringForward = useCallback(
    (nodeId: string) => {
      if (!reorderNode) return;
      const sorted = sortNodesByIndex(nodes);
      const currentIdx = sorted.findIndex(n => n.id === nodeId);
      if (currentIdx === -1 || currentIdx === sorted.length - 1) return;
      
      const nodeAbove = sorted[currentIdx + 1];
      const nodeAboveAbove = sorted[currentIdx + 2];
      const newIndex = generateKeyBetween(nodeAbove.index, nodeAboveAbove?.index ?? null);
      reorderNode(nodeId, newIndex);
    },
    [nodes, reorderNode]
  );

  const handleSendBackward = useCallback(
    (nodeId: string) => {
      if (!reorderNode) return;
      const sorted = sortNodesByIndex(nodes);
      const currentIdx = sorted.findIndex(n => n.id === nodeId);
      if (currentIdx === -1 || currentIdx === 0) return;
      
      const nodeBelow = sorted[currentIdx - 1];
      const nodeBelowBelow = sorted[currentIdx - 2];
      const newIndex = generateKeyBetween(nodeBelowBelow?.index ?? null, nodeBelow.index);
      reorderNode(nodeId, newIndex);
    },
    [nodes, reorderNode]
  );

  const handleChangeColor = useCallback(
    (nodeId: string) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { color: getRandomColor() });
      }
    },
    [updateNodeImmediate]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (deleteNode) {
        deleteNode(nodeId);
        removeFromSelection([nodeId]);
      }
    },
    [deleteNode, removeFromSelection]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      if (duplicateNode) {
        duplicateNode(nodeId);
      }
    },
    [duplicateNode]
  );

  // Menu items para o ContextMenu
  const menuItems = useMemo(() => {
    const nodeId = configMenu?.nodeId;
    if (!nodeId) return [];

    return [
      {
        id: "color",
        icon: "🎨",
        label: "Mudar cor",
        onClick: () => {
          handleChangeColor(nodeId);
          closeConfigMenu();
        },
      },
      {
        id: "duplicate",
        icon: "📋",
        label: "Duplicar",
        onClick: () => {
          handleDuplicateNode(nodeId);
          closeConfigMenu();
        },
      },
      {
        id: "layers",
        icon: "📑",
        label: "Camadas",
        submenu: [
          {
            id: "bring-to-front",
            icon: "⬆️",
            label: "Trazer para frente",
            onClick: () => {
              handleBringToFront(nodeId);
              closeConfigMenu();
            },
          },
          {
            id: "bring-forward",
            icon: "🔼",
            label: "Subir camada",
            onClick: () => {
              handleBringForward(nodeId);
              closeConfigMenu();
            },
          },
          {
            id: "send-backward",
            icon: "🔽",
            label: "Descer camada",
            onClick: () => {
              handleSendBackward(nodeId);
              closeConfigMenu();
            },
          },
          {
            id: "send-to-back",
            icon: "⬇️",
            label: "Enviar para trás",
            onClick: () => {
              handleSendToBack(nodeId);
              closeConfigMenu();
            },
          },
        ],
      },
      {
        id: "delete",
        icon: "🗑️",
        label: "Deletar",
        onClick: () => {
          handleDeleteNode(nodeId);
          closeConfigMenu();
        },
        danger: true,
      },
    ];
  }, [
    configMenu?.nodeId,
    handleChangeColor,
    handleDuplicateNode,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
    handleDeleteNode,
    closeConfigMenu,
  ]);

  // CSS Grid pattern para o background
  const gridStyle = {
    backgroundImage: `radial-gradient(circle, var(--canvas-grid, #d4d4d4) 1.5px, transparent 1.5px)`,
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
    backgroundPosition: `${CANVAS_PADDING}px ${CANVAS_PADDING}px`,
  };

  return (
    <div ref={containerRef} className="w-full min-h-full flex bg-bg-secondary">
      {/* Borda esquerda */}
      <div
        className="shrink-0 bg-bg-secondary"
        style={{ width: CANVAS_SIDE_BORDER }}
      />

      {/* Área do canvas com nodes */}
      <div
        ref={canvasAreaRef}
        className={`flex-1 relative bg-canvas-bg ${selectionBox ? "cursor-crosshair" : ""}`}
        style={{
          ...gridStyle,
          minHeight: canvasHeight,
        }}
        onClick={handleContainerClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        data-canvas-background="true"
      >
        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          const isPartOfMultiSelection = isSelected && selectedNodeIds.length > 1;
          
          // Calcula offset visual para nodes em group drag (exceto o node sendo arrastado)
          const groupDragOffset = groupDragState && 
            groupDragState.startPositions.has(node.id) && 
            node.id !== groupDragState.draggedNodeId
            ? groupDragState.delta
            : { x: 0, y: 0 };
          
          return (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={isSelected}
              isEditing={node.id === editingNodeId}
              isPartOfMultiSelection={isPartOfMultiSelection}
              groupDragOffset={groupDragOffset}
              onSelect={(ctrlKey) => {
                if (ctrlKey) {
                  toggleNodeSelection(node.id);
                } else {
                  selectNode(node.id);
                }
              }}
              onUpdatePosition={(x, y) => handleUpdatePosition(node.id, x, y)}
              onUpdateSize={(x, y, width, height) => handleUpdateSize(node.id, x, y, width, height)}
              onGroupDragStart={() => handleGroupDragStart(node.id)}
              onGroupDrag={(deltaX, deltaY) => handleGroupDrag(node.id, deltaX, deltaY)}
              onGroupDragEnd={(finalX, finalY) => handleGroupDragEnd(node.id, finalX, finalY)}
              onStartEdit={() => startEditingTitle(node.id)}
              onSaveTitle={(title, align) => handleSaveTitle(node.id, title, align)}
              onCancelEdit={stopEditingTitle}
              onConfigClick={(position) => openConfigMenu(node.id, position)}
              bounds="parent"
            />
          );
        })}

        {/* Retângulo de seleção (Marquee) */}
        {selectionBox && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-accent bg-accent/10"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
              zIndex: 9999,
            }}
          />
        )}
      </div>

      {/* Borda direita */}
      <div
        className="shrink-0 bg-bg-secondary"
        style={{ width: CANVAS_SIDE_BORDER }}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={configMenu !== null}
        position={configMenu?.position ?? { x: 0, y: 0 }}
        onClose={closeConfigMenu}
        items={menuItems}
      />

      {/* Bottom controls */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        {/* Contador de selecionados */}
        {selectedNodeIds.length > 0 && (
          <div className="px-3 py-2 bg-accent text-white text-sm font-medium rounded-lg shadow-lg">
            {selectedNodeIds.length} selecionado{selectedNodeIds.length > 1 ? "s" : ""}
          </div>
        )}
        {/* Contador total de nodes */}
        <div className="px-3 py-2 bg-bg-primary text-fg-primary text-sm font-medium rounded-lg shadow-lg border border-border-primary">
          <span className="text-fg-secondary">Nodes:</span> {nodes.length}
        </div>
      </div>
    </div>
  );
}
