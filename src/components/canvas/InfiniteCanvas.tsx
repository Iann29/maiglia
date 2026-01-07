"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useCanvas } from "./useCanvas";
import { drawGrid, drawNode, drawResizePreview, getHandleCursor } from "./canvas-utils";

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    nodes,
    selectedNodeId,
    isDragging,
    isResizing,
    hoveredHandle,
    resizePreview,
    canvasHeight,
    maxGridX,
    mouseGridPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    addNode,
    requestRender,
    shouldRenderRef,
    setContainerWidth,
    setMinHeight,
  } = useCanvas();

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
      drawNode(ctx, node, isSelected, isSelected ? hoveredHandle : null);
    });

    if (resizePreview && isResizing) {
      drawResizePreview(ctx, resizePreview);
    }

    shouldRenderRef.current = false;
  }, [nodes, selectedNodeId, hoveredHandle, resizePreview, isResizing, maxGridX, shouldRenderRef]);

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
