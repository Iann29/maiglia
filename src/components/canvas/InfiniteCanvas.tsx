"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useCanvas } from "./useCanvas";
import { drawGrid, drawNode } from "./canvas-utils";

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    camera,
    nodes,
    selectedNodeId,
    isPanning,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    addNode,
    deleteSelectedNode,
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
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = isDark ? "#0a0a0a" : "#fafafa";
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, camera, width, height, isDark);

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
          onClick={addNode}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
        >
          + Adicionar Nó
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/minha-conta"
          className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          Minha Conta
        </Link>

        <div className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          Zoom: {zoomPercentage}%
        </div>
      </div>

      {/* Help text */}
      <div className="absolute top-4 left-4 px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-xs rounded-lg backdrop-blur-sm">
        <p>Arrastar: mover canvas</p>
        <p>Scroll: zoom</p>
        <p>Del: remover nó selecionado</p>
      </div>
    </div>
  );
}
