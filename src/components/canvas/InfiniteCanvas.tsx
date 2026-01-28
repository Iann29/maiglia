"use client";

import { useCallback, useEffect, useRef, useMemo, useState, useContext, createContext } from "react";
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

// Context para receber funções do useNodes (que persistem no Convex)
interface CanvasContextType {
  deleteNodePersistent?: (nodeId: string) => Promise<void>;
  updateNodePersistent?: (nodeId: string, updates: Partial<CanvasNodeType>) => void;
}
export const CanvasContext = createContext<CanvasContextType>({});

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const didMarqueeRef = useRef(false); // Para evitar race condition com onClick
  
  // Refs para movimento em grupo
  const groupDragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const currentGroupDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Funções que persistem no Convex (passadas via context)
  const { deleteNodePersistent, updateNodePersistent } = useContext(CanvasContext);

  const {
    nodes,
    selectedNodeIds,
    editingNodeId,
    configMenu,
    updateNode,
    updateMultipleNodes,
    deleteNode,
    deleteSelectedNodes,
    duplicateNode,
    selectNode,
    selectNodes,
    toggleNodeSelection,
    clearSelection,
    startEditingTitle,
    saveTitle,
    stopEditingTitle,
    openConfigMenu,
    closeConfigMenu,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    changeColor,
    setContainerSize,
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
          // Deleta todos os nodes selecionados (persiste no Convex se disponível)
          if (deleteNodePersistent) {
            // Deleta cada node persistindo no Convex
            selectedNodeIds.forEach((id) => deleteNodePersistent(id));
          } else {
            // Fallback: só local
            deleteSelectedNodes();
          }
        }
      } else if (e.key === "Escape") {
        clearSelection();
        closeConfigMenu();
        setSelectionBox(null);
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        // Ctrl+A ou Cmd+A - seleciona todos os nodes
        e.preventDefault(); // Evita selecionar texto da página
        const allNodeIds = nodes.map((node) => node.id);
        if (allNodeIds.length > 0) {
          selectNodes(allNodeIds);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, deleteSelectedNodes, clearSelection, closeConfigMenu, nodes, selectNodes, deleteNodePersistent]);

  // Marquee selection handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Só inicia seleção se clicar no background do canvas
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackground) {
        // Calcula posição relativa ao canvas
        const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const x = e.clientX - canvasRect.left + (canvasAreaRef.current?.scrollLeft ?? 0);
        const y = e.clientY - canvasRect.top + (canvasAreaRef.current?.scrollTop ?? 0);

        setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
        
        // Limpa seleção anterior se não estiver segurando Ctrl
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
    // Marca que acabou de fazer marquee se o box era significativo (> 5px)
    if (selectionBox) {
      const width = Math.abs(selectionBox.currentX - selectionBox.startX);
      const height = Math.abs(selectionBox.currentY - selectionBox.startY);
      if (width > 5 || height > 5) {
        didMarqueeRef.current = true;
      }
    }
    setSelectionBox(null);
  }, [selectionBox]);

  // Click fora dos nodes para deselecionar (quando não está fazendo marquee)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Se acabou de fazer marquee, não limpa a seleção
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
  
  // Inicia movimento em grupo - armazena posições iniciais de todos os nodes selecionados
  const handleGroupDragStart = useCallback(
    (draggedNodeId: string) => {
      groupDragStartPositions.current.clear();
      currentGroupDelta.current = { x: 0, y: 0 };
      
      // Usa getState() para evitar stale closure após mudanças de seleção
      const { nodes: currentNodes, selectedNodeIds: currentSelectedIds } = useCanvasStore.getState();
      
      // Armazena posição inicial de todos os nodes selecionados
      currentNodes.forEach((node) => {
        if (currentSelectedIds.includes(node.id)) {
          groupDragStartPositions.current.set(node.id, { x: node.x, y: node.y });
        }
      });
    },
    [] // Sem dependências - usa getState() para valores atuais
  );

  // Durante o movimento - atualiza posição dos OUTROS nodes selecionados
  const handleGroupDrag = useCallback(
    (draggedNodeId: string, deltaX: number, deltaY: number) => {
      // Só atualiza se o delta mudou significativamente (evita updates desnecessários)
      if (
        Math.abs(deltaX - currentGroupDelta.current.x) < 1 &&
        Math.abs(deltaY - currentGroupDelta.current.y) < 1
      ) {
        return;
      }
      currentGroupDelta.current = { x: deltaX, y: deltaY };

      // Atualiza posição de TODOS os outros nodes selecionados (não o que está sendo arrastado)
      const updates: Array<{ id: string; updates: { x: number; y: number } }> = [];
      
      groupDragStartPositions.current.forEach((startPos, nodeId) => {
        if (nodeId !== draggedNodeId) {
          updates.push({
            id: nodeId,
            updates: {
              x: startPos.x + deltaX,
              y: startPos.y + deltaY,
            },
          });
        }
      });

      if (updates.length > 0) {
        updateMultipleNodes(updates);
      }
    },
    [updateMultipleNodes]
  );

  // Finaliza movimento em grupo - aplica snap to grid em todos os nodes e persiste no Convex
  const handleGroupDragEnd = useCallback(
    (draggedNodeId: string) => {
      const finalDelta = currentGroupDelta.current;
      
      // Aplica snap to grid em todos os outros nodes selecionados
      const updates: Array<{ id: string; updates: { x: number; y: number } }> = [];
      
      groupDragStartPositions.current.forEach((startPos, nodeId) => {
        if (nodeId !== draggedNodeId) {
          const finalX = snapToGrid(startPos.x + finalDelta.x);
          const finalY = snapToGrid(startPos.y + finalDelta.y);
          
          updates.push({
            id: nodeId,
            updates: { x: finalX, y: finalY },
          });
          
          // Persiste no Convex se disponível
          if (updateNodePersistent) {
            updateNodePersistent(nodeId, { x: finalX, y: finalY });
          }
        }
      });

      if (updates.length > 0) {
        updateMultipleNodes(updates);
      }

      // Limpa refs
      groupDragStartPositions.current.clear();
      currentGroupDelta.current = { x: 0, y: 0 };
    },
    [updateMultipleNodes, updateNodePersistent]
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
          changeColor(nodeId, getRandomColor());
          closeConfigMenu();
        },
      },
      {
        id: "duplicate",
        icon: "📋",
        label: "Duplicar",
        onClick: () => {
          duplicateNode(nodeId);
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
              bringToFront(nodeId);
              closeConfigMenu();
            },
          },
          {
            id: "bring-forward",
            icon: "🔼",
            label: "Subir camada",
            onClick: () => {
              bringForward(nodeId);
              closeConfigMenu();
            },
          },
          {
            id: "send-backward",
            icon: "🔽",
            label: "Descer camada",
            onClick: () => {
              sendBackward(nodeId);
              closeConfigMenu();
            },
          },
          {
            id: "send-to-back",
            icon: "⬇️",
            label: "Enviar para trás",
            onClick: () => {
              sendToBack(nodeId);
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
          deleteNode(nodeId);
          closeConfigMenu();
        },
        danger: true,
      },
    ];
  }, [
    configMenu?.nodeId,
    changeColor,
    duplicateNode,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    deleteNode,
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
          
          return (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={isSelected}
              isEditing={node.id === editingNodeId}
              isPartOfMultiSelection={isPartOfMultiSelection}
              onSelect={(ctrlKey) => {
                if (ctrlKey) {
                  toggleNodeSelection(node.id);
                } else {
                  selectNode(node.id);
                }
              }}
              onUpdatePosition={(x, y) => updateNode(node.id, { x, y })}
              onUpdateSize={(x, y, width, height) =>
                updateNode(node.id, { x, y, width, height })
              }
              onGroupDragStart={() => handleGroupDragStart(node.id)}
              onGroupDrag={(deltaX, deltaY) => handleGroupDrag(node.id, deltaX, deltaY)}
              onGroupDragEnd={() => handleGroupDragEnd(node.id)}
              onStartEdit={() => startEditingTitle(node.id)}
              onSaveTitle={(title, align) => saveTitle(node.id, title, align)}
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
        {/* Contador de selecionados (só aparece quando há seleção) */}
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
