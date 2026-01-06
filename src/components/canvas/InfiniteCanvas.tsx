"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useCanvas } from "./useCanvas";
import { drawGrid, drawNode, drawAxes } from "./canvas-utils";

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    camera,
    nodes,
    selectedNodeId,
    isPanning,
    isDragging,
    mouseWorldPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    addNode,
    deleteSelectedNode,
    resetCamera,
    requestRender,
    shouldRenderRef,
  } = useCanvas();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Pegar cor de fundo do CSS
    const styles = getComputedStyle(document.documentElement);
    const canvasBg = styles.getPropertyValue("--canvas-bg").trim() || "#fafafa";

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, camera, width, height);
    drawAxes(ctx, camera, width, height);

    nodes.forEach((node) => {
      drawNode(ctx, node, camera, node.id === selectedNodeId);
    });

    shouldRenderRef.current = false;
  }, [camera, nodes, selectedNodeId, shouldRenderRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

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
  }, [requestRender]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedNode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedNode]);

  const zoomPercentage = Math.round(camera.scale * 100);

  const handleResetCamera = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      resetCamera(rect.width, rect.height);
    }
  }, [resetCamera]);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`block ${isPanning ? "cursor-grabbing" : isDragging ? "cursor-move" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleResetCamera}
          className="px-3 py-2 bg-bg-primary hover:bg-bg-secondary text-fg-primary text-sm font-medium rounded-lg shadow-lg transition-colors border border-border-primary"
          title="Voltar para origem (0, 0)"
        >
          ⌂ Origem
        </button>
        <button
          onClick={addNode}
          className="px-3 py-2 bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium rounded-lg shadow-lg transition-colors"
        >
          + Adicionar Nó
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/minha-conta"
          className="px-3 py-2 bg-bg-primary text-fg-primary text-sm font-medium rounded-lg shadow-lg hover:bg-bg-secondary transition-colors border border-border-primary"
        >
          Minha Conta
        </Link>

        <div className="px-3 py-2 bg-bg-primary text-fg-primary text-sm font-medium rounded-lg shadow-lg border border-border-primary">
          <span className="text-fg-secondary">Cursor:</span> ({Math.round(mouseWorldPos.x)}, {Math.round(mouseWorldPos.y)})
          <span className="mx-2 text-fg-muted">|</span>
          <span className="text-fg-secondary">Zoom:</span> {zoomPercentage}%
        </div>
      </div>

      {/* Help text */}
      <div className="absolute top-4 left-4 px-3 py-2 bg-bg-primary/80 text-fg-secondary text-xs rounded-lg backdrop-blur-sm border border-border-primary">
        <p>Arrastar: mover canvas</p>
        <p>Scroll: zoom</p>
        <p>Del: remover nó selecionado</p>
      </div>
    </div>
  );
}
