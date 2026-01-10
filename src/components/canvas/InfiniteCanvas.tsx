"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { CanvasNode } from "./CanvasNode";
import { ContextMenu } from "./ContextMenu";
import { useCanvasStore } from "./useCanvasStore";
import {
  GRID_SIZE,
  CANVAS_PADDING,
  CANVAS_SIDE_BORDER,
  getRandomColor,
} from "./canvas-types";

const HEADER_HEIGHT = 56;

export function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);

  const {
    nodes,
    selectedNodeId,
    editingNodeId,
    configMenu,
    updateNode,
    deleteNode,
    duplicateNode,
    selectNode,
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
        if (!isInput && selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      } else if (e.key === "Escape") {
        selectNode(null);
        closeConfigMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, deleteNode, selectNode, closeConfigMenu]);

  // Click fora dos nodes para deselecionar
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackground) {
        selectNode(null);
        closeConfigMenu();
      }
    },
    [selectNode, closeConfigMenu]
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
        className="flex-1 relative bg-canvas-bg"
        style={{
          ...gridStyle,
          minHeight: canvasHeight,
        }}
        onClick={handleContainerClick}
        data-canvas-background="true"
      >
        {/* Nodes */}
        {nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isEditing={node.id === editingNodeId}
            onSelect={() => selectNode(node.id)}
            onUpdatePosition={(x, y) => updateNode(node.id, { x, y })}
            onUpdateSize={(x, y, width, height) =>
              updateNode(node.id, { x, y, width, height })
            }
            onStartEdit={() => startEditingTitle(node.id)}
            onSaveTitle={(title, align) => saveTitle(node.id, title, align)}
            onCancelEdit={stopEditingTitle}
            onConfigClick={(position) => openConfigMenu(node.id, position)}
            bounds="parent"
          />
        ))}
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
      <div className="fixed bottom-4 right-4">
        <div className="px-3 py-2 bg-bg-primary text-fg-primary text-sm font-medium rounded-lg shadow-lg border border-border-primary">
          <span className="text-fg-secondary">Nodes:</span> {nodes.length}
        </div>
      </div>
    </div>
  );
}
