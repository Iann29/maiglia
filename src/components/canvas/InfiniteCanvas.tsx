"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useCanvas } from "./useCanvas";
import { drawGrid, drawNode, drawResizePreview, getHandleCursor, getRandomColor } from "./canvas-utils";
import { RadialMenu } from "./RadialMenu";

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  ], [configMenuNodeId, changeNodeColor, duplicateNode, deleteNode, closeConfigMenu]);

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

    nodes.forEach((node) => {
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const showIconHovered = isHovered && isConfigIconHovered;
      drawNode(ctx, node, isSelected, isSelected ? hoveredHandle : null, isHovered, showIconHovered);
    });

    if (resizePreview && isResizing) {
      drawResizePreview(ctx, resizePreview);
    }

    shouldRenderRef.current = false;
  }, [nodes, selectedNodeId, hoveredNodeId, isConfigIconHovered, hoveredHandle, resizePreview, isResizing, maxGridX, shouldRenderRef]);

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

      requestRender();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

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

      {/* Menu radial */}
      <RadialMenu
        isOpen={configMenuNodeId !== null}
        position={configMenuPosition ?? { x: 0, y: 0 }}
        onClose={closeConfigMenu}
        items={menuItems}
      />

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
