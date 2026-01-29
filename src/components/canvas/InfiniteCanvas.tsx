"use client";

import { useCallback, useEffect, useRef, useMemo, useState, useContext, createContext } from "react";
import { generateKeyBetween } from "fractional-indexing";
import { CanvasNode } from "./CanvasNode";
import { NodeSettingsPanel } from "./NodeSettingsPanel";
import { ImageGalleryModal } from "@/components/ui/ImageGalleryModal";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { useCanvasStore } from "./useCanvasStore";
import {
  GRID_SIZE,
  CANVAS_PADDING,
  CANVAS_SIDE_BORDER,
  snapToGrid,
  type CanvasNode as CanvasNodeType,
  type TitleSize,
  type NodeStyle,
} from "./canvas-types";
import { findFreePositionForGroup, constrainDrawRect, type Rect } from "./collision";

// Interface para o retângulo de desenho (draw-to-create)
interface DrawRect {
  anchorX: number;  // Ponto fixo onde clicou
  anchorY: number;
  currentX: number; // Ponto atual do mouse
  currentY: number;
  constrained: { x: number; y: number; width: number; height: number }; // Retângulo limitado
}

// Interface para menu de tipo de node
interface PendingNode {
  x: number;
  y: number;
  width: number;
  height: number;
  menuPosition: { x: number; y: number };
}

// Header (56px) + WorkspaceTabs (40px) = 96px
const HEADER_HEIGHT = 96;

// Tamanho mínimo para criar node via draw-to-create (5x3 células do grid)
const MIN_DRAW_WIDTH = 5 * GRID_SIZE;  // 100px
const MIN_DRAW_HEIGHT = 3 * GRID_SIZE; // 60px

// Context para receber funções do useNodes (que persistem no Convex)
// NOTA: Todas as funções usam clientId como identificador (não _id do Convex)
interface CanvasContextType {
  nodes: CanvasNodeType[];
  createNode?: (type?: "note" | "table" | "checklist" | "image", imageUrl?: string, x?: number, y?: number, width?: number, height?: number) => Promise<unknown>;
  deleteNode?: (clientId: string) => Promise<void>;
  deleteNodes?: (clientIds: string[]) => Promise<void>;
  updateNodeImmediate?: (clientId: string, updates: Partial<CanvasNodeType>) => Promise<void>;
  updateNodes?: (updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number }>) => Promise<void>;
  duplicateNode?: (clientId: string) => Promise<unknown>;
  reorderNode?: (clientId: string, newIndex: string) => Promise<void>;
  updateNodeContent?: (clientId: string, content: unknown) => Promise<void>;
}
export const CanvasContext = createContext<CanvasContextType>({ nodes: [] });

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [drawRect, setDrawRect] = useState<DrawRect | null>(null);
  const [pendingNode, setPendingNode] = useState<PendingNode | null>(null);
  
  // Estado para movimento em grupo (usa state para trigger re-renders durante drag)
  const [groupDragState, setGroupDragState] = useState<{
    draggedNodeId: string;
    delta: { x: number; y: number };
    targetDelta: { x: number; y: number }; // Delta ajustado livre de colisão
    startPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  } | null>(null);
  
  // Ref para throttle da verificação de colisão em group drag
  const lastGroupCollisionCheckRef = useRef<number>(0);
  
  // Ref para throttle da verificação de colisão durante draw-to-create
  const lastDrawCollisionCheckRef = useRef<number>(0);
  const lastConstrainedRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Ref para evitar que onClick dispare após draw-to-create
  const justFinishedDrawRef = useRef<boolean>(false);
  
  // Estado para galeria de imagens e menu do FAB
  const [showGallery, setShowGallery] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  
  // Estado para emoji picker
  const [emojiPicker, setEmojiPicker] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);
  
  // Funções e dados do useNodes (passados via context)
  const { 
    nodes,
    createNode,
    deleteNode, 
    deleteNodes,
    updateNodeImmediate, 
    updateNodes,
    duplicateNode,
    reorderNode,
    updateNodeContent,
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
        setDrawRect(null);
        setPendingNode(null);
        setShowFabMenu(false);
        setEmojiPicker(null);
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

  // Draw-to-create handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Só inicia desenho se clicar no background do canvas
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackground) {
        const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const x = e.clientX - canvasRect.left + (canvasAreaRef.current?.scrollLeft ?? 0);
        const y = e.clientY - canvasRect.top + (canvasAreaRef.current?.scrollTop ?? 0);

        // Fecha menus e cancela pendingNode
        setPendingNode(null);
        closeConfigMenu();
        setShowFabMenu(false);
        setEmojiPicker(null);
        
        // Limpa seleção se não estiver segurando Ctrl/Cmd
        if (!e.ctrlKey && !e.metaKey) {
          clearSelection();
        }
        
        // Reseta refs de throttle para novo desenho
        lastDrawCollisionCheckRef.current = 0;
        lastConstrainedRectRef.current = null;
        
        // Prepara rects dos nodes para detecção de colisão
        const nodeRects: Rect[] = nodes.map(n => ({ x: n.x, y: n.y, width: n.width, height: n.height }));
        const constrained = constrainDrawRect(x, y, x, y, nodeRects, GRID_SIZE);
        
        setDrawRect({ 
          anchorX: x, 
          anchorY: y, 
          currentX: x, 
          currentY: y,
          constrained
        });
      }
    },
    [nodes, clearSelection, closeConfigMenu]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawRect) return;

      const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const x = e.clientX - canvasRect.left + (canvasAreaRef.current?.scrollLeft ?? 0);
      const y = e.clientY - canvasRect.top + (canvasAreaRef.current?.scrollTop ?? 0);

      // Throttle da verificação de colisão (30ms) para melhor performance com muitos nodes
      const now = Date.now();
      let constrained = lastConstrainedRectRef.current ?? drawRect.constrained;
      
      if (now - lastDrawCollisionCheckRef.current > 30) {
        lastDrawCollisionCheckRef.current = now;
        // Calcula retângulo limitado por colisões
        const nodeRects: Rect[] = nodes.map(n => ({ x: n.x, y: n.y, width: n.width, height: n.height }));
        constrained = constrainDrawRect(drawRect.anchorX, drawRect.anchorY, x, y, nodeRects, GRID_SIZE);
        lastConstrainedRectRef.current = constrained;
      }
      
      setDrawRect({ 
        ...drawRect, 
        currentX: x, 
        currentY: y,
        constrained
      });
    },
    [drawRect, nodes]
  );

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drawRect) return;
      
      // Calcula o retângulo final com colisão (sem throttle) para garantir precisão
      const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
      let constrained = drawRect.constrained;
      
      if (canvasRect) {
        const finalX = e.clientX - canvasRect.left + (canvasAreaRef.current?.scrollLeft ?? 0);
        const finalY = e.clientY - canvasRect.top + (canvasAreaRef.current?.scrollTop ?? 0);
        const nodeRects: Rect[] = nodes.map(n => ({ x: n.x, y: n.y, width: n.width, height: n.height }));
        constrained = constrainDrawRect(drawRect.anchorX, drawRect.anchorY, finalX, finalY, nodeRects, GRID_SIZE);
      }
      
      // Verifica se o retângulo tem tamanho mínimo válido
      if (constrained.width >= MIN_DRAW_WIDTH && constrained.height >= MIN_DRAW_HEIGHT) {
        // Calcula posição do menu (canto superior direito do retângulo)
        const canvasRect = canvasAreaRef.current?.getBoundingClientRect();
        if (canvasRect) {
          const menuX = canvasRect.left + constrained.x + constrained.width + 8;
          const menuY = canvasRect.top + constrained.y;
          
          setPendingNode({
            x: constrained.x,
            y: constrained.y,
            width: constrained.width,
            height: constrained.height,
            menuPosition: { x: menuX, y: menuY }
          });
          
          // Flag para evitar que onClick limpe o pendingNode imediatamente
          justFinishedDrawRef.current = true;
        }
      }
      
      setDrawRect(null);
    },
    [drawRect, nodes]
  );

  // Click fora dos nodes para deselecionar (apenas se não houver pendingNode)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Ignora o click que vem imediatamente após um draw-to-create
      // (onClick dispara depois de onMouseUp, então precisamos evitar que limpe o pendingNode)
      if (justFinishedDrawRef.current) {
        justFinishedDrawRef.current = false;
        return;
      }
      
      // Click no canvas fecha o menu de tipo se estiver aberto
      if (pendingNode) {
        setPendingNode(null);
        return;
      }
      
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackground) {
        clearSelection();
        closeConfigMenu();
        setShowFabMenu(false);
        setEmojiPicker(null);
      }
    },
    [clearSelection, closeConfigMenu, pendingNode]
  );

  // === Handlers para movimento em grupo ===
  
  const handleGroupDragStart = useCallback(
    (draggedNodeId: string) => {
      const { selectedNodeIds: currentSelectedIds } = useCanvasStore.getState();
      
      // Cria mapa com posições e tamanhos iniciais de todos os nodes selecionados
      const startPositions = new Map<string, { x: number; y: number; width: number; height: number }>();
      nodes.forEach((node) => {
        if (currentSelectedIds.includes(node.id)) {
          startPositions.set(node.id, { x: node.x, y: node.y, width: node.width, height: node.height });
        }
      });
      
      setGroupDragState({
        draggedNodeId,
        delta: { x: 0, y: 0 },
        targetDelta: { x: 0, y: 0 },
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
        
        // Throttle da verificação de colisão
        const now = Date.now();
        let newTargetDelta = prev.targetDelta;
        
        if (now - lastGroupCollisionCheckRef.current > 50) {
          lastGroupCollisionCheckRef.current = now;
          
          // Prepara dados do grupo para verificação de colisão
          const groupNodes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
          prev.startPositions.forEach((pos, id) => {
            groupNodes.push({ id, x: pos.x, y: pos.y, width: pos.width, height: pos.height });
          });
          
          // Prepara todos os nodes como rects
          const allRects = nodes.map(n => ({ x: n.x, y: n.y, width: n.width, height: n.height }));
          const allIds = nodes.map(n => n.id);
          
          // Calcula posição livre para o grupo
          const snappedDeltaX = snapToGrid(deltaX);
          const snappedDeltaY = snapToGrid(deltaY);
          newTargetDelta = findFreePositionForGroup(
            snappedDeltaX,
            snappedDeltaY,
            groupNodes,
            allRects,
            allIds,
            GRID_SIZE,
            CANVAS_PADDING,
            CANVAS_PADDING
          );
        }
        
        return { ...prev, delta: { x: deltaX, y: deltaY }, targetDelta: newTargetDelta };
      });
    },
    [nodes]
  );

  const handleGroupDragEnd = useCallback(
    (draggedNodeId: string, finalX: number, finalY: number) => {
      if (!groupDragState) return;
      
      // Usa o delta alvo (livre de colisão) em vez do delta visual
      const finalDelta = groupDragState.targetDelta;
      
      // Prepara updates para todos os nodes do grupo
      const updates: Array<{ id: string; x: number; y: number }> = [];
      
      groupDragState.startPositions.forEach((startPos, nodeId) => {
        const finalNodeX = snapToGrid(startPos.x + finalDelta.x);
        const finalNodeY = snapToGrid(startPos.y + finalDelta.y);
        updates.push({ id: nodeId, x: finalNodeX, y: finalNodeY });
      });

      // Atualiza todos os nodes do grupo em batch (incluindo o arrastado)
      if (updates.length > 0 && updateNodes) {
        updateNodes(updates);
      }

      // Limpa o estado de group drag
      setGroupDragState(null);
    },
    [groupDragState, updateNodes]
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

  // Handler para selecionar imagem da galeria
  const handleSelectGalleryImage = useCallback(
    (imageUrl: string) => {
      if (createNode) {
        // Se há pendingNode, cria com posição/tamanho específicos
        if (pendingNode) {
          createNode("image", imageUrl, pendingNode.x, pendingNode.y, pendingNode.width, pendingNode.height);
          setPendingNode(null);
        } else {
          createNode("image", imageUrl);
        }
      }
      setShowGallery(false);
      setShowFabMenu(false);
    },
    [createNode, pendingNode]
  );
  
  // Handler para criar node via menu de tipo (draw-to-create)
  const handleCreateNodeFromPending = useCallback(
    (type: "note" | "checklist") => {
      if (createNode && pendingNode) {
        createNode(type, undefined, pendingNode.x, pendingNode.y, pendingNode.width, pendingNode.height);
        setPendingNode(null);
      }
    },
    [createNode, pendingNode]
  );
  
  // Handler para abrir galeria a partir do menu de tipo
  const handleOpenGalleryFromPending = useCallback(() => {
    setShowGallery(true);
    // Mantém pendingNode para usar a posição ao selecionar imagem
  }, []);

  // Handler para abrir emoji picker
  const handleIconClick = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setEmojiPicker({ nodeId, position });
    },
    []
  );

  // Handler para selecionar emoji
  const handleSelectEmoji = useCallback(
    (emoji: string) => {
      if (emojiPicker && updateNodeImmediate) {
        updateNodeImmediate(emojiPicker.nodeId, { icon: emoji });
      }
      setEmojiPicker(null);
    },
    [emojiPicker, updateNodeImmediate]
  );

  // Handler para mudar conteúdo do node
  const handleContentChange = useCallback(
    (nodeId: string, content: unknown) => {
      if (updateNodeContent) {
        updateNodeContent(nodeId, content);
      }
    },
    [updateNodeContent]
  );

  // Handler para mudar cor do node (via painel de settings)
  const handleColorChange = useCallback(
    (nodeId: string, color: string) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { color });
      }
    },
    [updateNodeImmediate]
  );

  // Handler para mudar tamanho do título do node
  const handleTitleSizeChange = useCallback(
    (nodeId: string, titleSize: TitleSize) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { titleSize });
      }
    },
    [updateNodeImmediate]
  );

  // Handler para remover ícone do node
  const handleRemoveIcon = useCallback(
    (nodeId: string) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { icon: "" });
      }
    },
    [updateNodeImmediate]
  );

  // Handler para mudar estilo do node
  const handleStyleChange = useCallback(
    (nodeId: string, style: NodeStyle) => {
      if (updateNodeImmediate) {
        updateNodeImmediate(nodeId, { style });
      }
    },
    [updateNodeImmediate]
  );

  // Dados do node atual para o painel de configurações
  const configNode = useMemo(() => {
    if (!configMenu?.nodeId) return null;
    return nodes.find((n) => n.id === configMenu.nodeId) ?? null;
  }, [configMenu?.nodeId, nodes]);

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
        className={`flex-1 relative bg-canvas-bg ${drawRect ? "cursor-crosshair" : ""}`}
        style={{
          ...gridStyle,
          minHeight: canvasHeight,
        }}
        onClick={handleContainerClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => setDrawRect(null)}
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
          
          // Calcula target offset para ghost preview do grupo
          const groupTargetOffset = groupDragState &&
            groupDragState.startPositions.has(node.id)
            ? groupDragState.targetDelta
            : undefined;
          
          return (
            <CanvasNode
              key={node.id}
              node={node}
              allNodes={nodes}
              isSelected={isSelected}
              isEditing={node.id === editingNodeId}
              isPartOfMultiSelection={isPartOfMultiSelection}
              groupDragOffset={groupDragOffset}
              groupTargetOffset={groupTargetOffset}
              onSelect={(shiftOrCtrlKey) => {
                if (shiftOrCtrlKey) {
                  // Shift/Ctrl+Click - adiciona/remove da seleção
                  toggleNodeSelection(node.id);
                } else {
                  // Click normal - seleciona apenas este node
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
              onIconClick={(position) => handleIconClick(node.id, position)}
              onContentChange={(content) => handleContentChange(node.id, content)}
              bounds="parent"
            />
          );
        })}

        {/* Retângulo de desenho (Draw-to-Create) */}
        {drawRect && drawRect.constrained.width > 0 && drawRect.constrained.height > 0 && (() => {
          const isTooSmall = drawRect.constrained.width < MIN_DRAW_WIDTH || drawRect.constrained.height < MIN_DRAW_HEIGHT;
          return (
            <div
              className={`absolute pointer-events-none border-2 border-dashed rounded-lg transition-colors duration-150 ${
                isTooSmall 
                  ? "border-error bg-error/10" 
                  : "border-accent bg-accent/10"
              }`}
              style={{
                left: drawRect.constrained.x,
                top: drawRect.constrained.y,
                width: drawRect.constrained.width,
                height: drawRect.constrained.height,
                zIndex: 9999,
              }}
            >
              {/* Badge de tamanho */}
              <div className={`absolute -top-7 left-0 px-2 py-1 text-xs font-bold rounded shadow-lg transition-colors duration-150 ${
                isTooSmall 
                  ? "bg-error text-white" 
                  : "bg-accent text-accent-fg"
              }`}>
                {Math.round(drawRect.constrained.width / GRID_SIZE)}×{Math.round(drawRect.constrained.height / GRID_SIZE)}
              </div>
            </div>
          );
        })()}
        
        {/* Preview do pending node */}
        {pendingNode && (
          <div
            className="absolute pointer-events-none border-2 border-solid border-accent bg-accent/20 rounded-lg animate-pulse"
            style={{
              left: pendingNode.x,
              top: pendingNode.y,
              width: pendingNode.width,
              height: pendingNode.height,
              zIndex: 9998,
            }}
          />
        )}
      </div>

      {/* Borda direita */}
      <div
        className="shrink-0 bg-bg-secondary"
        style={{ width: CANVAS_SIDE_BORDER }}
      />

      {/* Node Settings Panel */}
      <NodeSettingsPanel
        isOpen={configMenu !== null && configNode !== null}
        position={configMenu?.position ?? { x: 0, y: 0 }}
        nodeId={configMenu?.nodeId ?? ""}
        currentIcon={configNode?.icon}
        currentColor={configNode?.color ?? ""}
        currentTitleSize={configNode?.titleSize ?? "M"}
        currentStyle={configNode?.style ?? 0}
        onClose={closeConfigMenu}
        onIconClick={() => {
          if (configMenu?.nodeId && configMenu?.position) {
            // Abre o emoji picker na mesma posição do painel
            setEmojiPicker({
              nodeId: configMenu.nodeId,
              position: { x: configMenu.position.x, y: configMenu.position.y + 60 },
            });
          }
        }}
        onRemoveIcon={() => {
          if (configMenu?.nodeId) {
            handleRemoveIcon(configMenu.nodeId);
          }
        }}
        onColorChange={(color) => {
          if (configMenu?.nodeId) {
            handleColorChange(configMenu.nodeId, color);
          }
        }}
        onTitleSizeChange={(size) => {
          if (configMenu?.nodeId) {
            handleTitleSizeChange(configMenu.nodeId, size);
          }
        }}
        onStyleChange={(style) => {
          if (configMenu?.nodeId) {
            handleStyleChange(configMenu.nodeId, style);
          }
        }}
        onDelete={() => {
          if (configMenu?.nodeId) {
            handleDeleteNode(configMenu.nodeId);
          }
        }}
        onDuplicate={() => {
          if (configMenu?.nodeId) {
            handleDuplicateNode(configMenu.nodeId);
          }
        }}
      />

      {/* Menu de tipo para draw-to-create */}
      {pendingNode && (
        <div 
          className="fixed bg-bg-primary rounded-xl shadow-xl border border-border-primary p-2 flex flex-col gap-1 z-[10000001]"
          style={{
            left: pendingNode.menuPosition.x,
            top: pendingNode.menuPosition.y,
          }}
        >
          <div className="px-3 py-1 text-xs text-fg-secondary font-medium border-b border-border-primary mb-1">
            Tipo do bloco
          </div>
          <button
            onClick={() => handleCreateNodeFromPending("note")}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary rounded-lg transition-colors text-fg-primary"
          >
            <span className="text-xl">📝</span>
            <span>Bloco de nota</span>
          </button>
          <button
            onClick={() => handleCreateNodeFromPending("checklist")}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary rounded-lg transition-colors text-fg-primary"
          >
            <span className="text-xl">✅</span>
            <span>Checklist</span>
          </button>
          <button
            onClick={handleOpenGalleryFromPending}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary rounded-lg transition-colors text-fg-primary"
          >
            <span className="text-xl">🖼️</span>
            <span>Imagem da galeria</span>
          </button>
        </div>
      )}
      
      {/* Menu do FAB */}
      {showFabMenu && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-bg-primary rounded-xl shadow-xl border border-border-primary p-2 flex flex-col gap-1 z-[10000000]">
          <button
            onClick={() => {
              createNode?.("note");
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary rounded-lg transition-colors text-fg-primary"
          >
            <span className="text-xl">📝</span>
            <span>Bloco de nota</span>
          </button>
          <button
            onClick={() => {
              createNode?.("checklist");
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary rounded-lg transition-colors text-fg-primary"
          >
            <span className="text-xl">✅</span>
            <span>Checklist</span>
          </button>
          <button
            onClick={() => {
              setShowGallery(true);
              setShowFabMenu(false);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary rounded-lg transition-colors text-fg-primary"
          >
            <span className="text-xl">🖼️</span>
            <span>Imagem da galeria</span>
          </button>
        </div>
      )}

      {/* Botão flutuante (FAB) */}
      <button
        onClick={() => setShowFabMenu(!showFabMenu)}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-accent hover:bg-accent-hover active:scale-95 text-accent-fg rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 z-[10000000] ${showFabMenu ? "rotate-45" : "hover:scale-110"}`}
        title="Adicionar"
        aria-label="Adicionar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Modal de galeria de imagens */}
      <ImageGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={handleSelectGalleryImage}
      />

      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={emojiPicker !== null}
        position={emojiPicker?.position ?? { x: 0, y: 0 }}
        onSelect={handleSelectEmoji}
        onClose={() => setEmojiPicker(null)}
      />

      {/* Bottom controls */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        {/* Contador de selecionados */}
        {selectedNodeIds.length > 0 && (
          <div className="px-3 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg shadow-lg">
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
