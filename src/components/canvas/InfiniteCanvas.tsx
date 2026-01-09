"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import { useCanvas } from "./useCanvas";
import { drawGrid, drawNode, drawResizePreview, getHandleCursor, getRandomColor } from "./canvas-utils";
import { ContextMenu } from "./ContextMenu";
import { NodeTitleEditor } from "./NodeTitleEditor";
import { sortNodesByIndex } from "./layer-utils";

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  const {
    nodes,
    selectedNodeId,
    hoveredNodeId,
    isConfigIconHovered,
    isDragging,
    isResizing,
    hoveredHandle,
    resizePreview,
    canvasHeight,
    maxGridX,
    mouseGridPos,
    configMenuNodeId,
    configMenuPosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    addNode,
    deleteNode,
    duplicateNode,
    changeNodeColor,
    closeConfigMenu,
    nodeBringToFront,
    nodeSendToBack,
    nodeBringForward,
    nodeSendBackward,
    editingNodeId,
    saveNodeTitle,
    stopEditingTitle,
    requestRender,
    shouldRenderRef,
    setContainerWidth,
    setMinHeight,
  } = useCanvas();

  const menuItems = useMemo(() => [
    {
      id: "color",
      icon: "🎨",
      label: "Mudar cor",
      onClick: () => {
        if (configMenuNodeId) {
          changeNodeColor(configMenuNodeId, getRandomColor());
        }
        closeConfigMenu();
      },
    },
    {
      id: "duplicate",
      icon: "📋",
      label: "Duplicar",
      onClick: () => {
        if (configMenuNodeId) {
          duplicateNode(configMenuNodeId);
        }
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
            if (configMenuNodeId) nodeBringToFront(configMenuNodeId);
            closeConfigMenu();
          },
        },
        {
          id: "bring-forward",
          icon: "🔼",
          label: "Subir camada",
          onClick: () => {
            if (configMenuNodeId) nodeBringForward(configMenuNodeId);
            closeConfigMenu();
          },
        },
        {
          id: "send-backward",
          icon: "🔽",
          label: "Descer camada",
          onClick: () => {
            if (configMenuNodeId) nodeSendBackward(configMenuNodeId);
            closeConfigMenu();
          },
        },
        {
          id: "send-to-back",
          icon: "⬇️",
          label: "Enviar para trás",
          onClick: () => {
            if (configMenuNodeId) nodeSendToBack(configMenuNodeId);
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
        if (configMenuNodeId) {
          deleteNode(configMenuNodeId);
        }
        closeConfigMenu();
      },
      danger: true,
    },
  ], [configMenuNodeId, changeNodeColor, duplicateNode, deleteNode, closeConfigMenu, nodeBringToFront, nodeBringForward, nodeSendBackward, nodeSendToBack]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const styles = getComputedStyle(document.documentElement);
    const canvasBg = styles.getPropertyValue("--canvas-bg").trim() || "#fafafa";

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height, maxGridX);

    const sortedNodes = sortNodesByIndex(nodes);
    sortedNodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const showIconHovered = isHovered && isConfigIconHovered;
      const isEditing = node.id === editingNodeId;
      drawNode(ctx, node, isSelected, isSelected ? hoveredHandle : null, isHovered, showIconHovered, isEditing);
    });

    if (resizePreview && isResizing) {
      drawResizePreview(ctx, resizePreview);
    }

    shouldRenderRef.current = false;
  }, [nodes, selectedNodeId, hoveredNodeId, isConfigIconHovered, hoveredHandle, resizePreview, isResizing, maxGridX, editingNodeId, shouldRenderRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;

      setContainerWidth(width);
      setMinHeight(window.innerHeight);

      canvas.width = width * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${canvasHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      setCanvasRect(canvas.getBoundingClientRect());
      requestRender();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", () => setCanvasRect(canvas.getBoundingClientRect()));

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [canvasHeight, requestRender, setContainerWidth, setMinHeight]);

  useEffect(() => {
    let frameId: number;

    const loop = () => {
      if (shouldRenderRef.current) {
        render();
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [render, shouldRenderRef]);

  const getCursorStyle = (): React.CSSProperties => {
    if (isResizing || hoveredHandle) {
      return { cursor: getHandleCursor(hoveredHandle) };
    }
    if (isDragging) return { cursor: "move" };
    if (isConfigIconHovered) return { cursor: "pointer" };
    return { cursor: "default" };
  };

  return (
    <div ref={containerRef} className="w-full min-h-screen">
      <canvas
        ref={canvasRef}
        className="block"
        style={getCursorStyle()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <ContextMenu
        isOpen={configMenuNodeId !== null}
        position={configMenuPosition ?? { x: 0, y: 0 }}
        onClose={closeConfigMenu}
        items={menuItems}
      />

      {editingNodeId && canvasRect && (() => {
        const editingNode = nodes.find((n) => n.id === editingNodeId);
        if (!editingNode) return null;
        return (
          <NodeTitleEditor
            node={editingNode}
            canvasRect={canvasRect}
            onSave={(title, align) => saveNodeTitle(editingNodeId, title, align)}
            onCancel={stopEditingTitle}
          />
        );
      })()}

      {/* Top controls */}
      <div className="fixed top-4 right-4 flex gap-2">
        <button
          onClick={addNode}
          className="px-3 py-2 bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium rounded-lg shadow-lg transition-colors"
        >
          + Adicionar Bloco
        </button>
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/minha-conta"
          className="px-3 py-2 bg-bg-primary text-fg-primary text-sm font-medium rounded-lg shadow-lg hover:bg-bg-secondary transition-colors border border-border-primary"
        >
          Minha Conta
        </Link>

        <div className="px-3 py-2 bg-bg-primary text-fg-primary text-sm font-medium rounded-lg shadow-lg border border-border-primary">
          <span className="text-fg-secondary">Posição:</span> ({mouseGridPos.x}, {mouseGridPos.y})
        </div>
      </div>
    </div>
  );
}
