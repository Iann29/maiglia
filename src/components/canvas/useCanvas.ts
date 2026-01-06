"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CanvasNode,
  type Point,
  clamp,
  screenToGrid,
  getNodeAtPoint,
  generateNodeId,
  getRandomColor,
  calculateCanvasHeight,
  getMaxGridX,
  findNextFreePosition,
} from "./canvas-utils";

interface UseCanvasReturn {
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  isDragging: boolean;
  canvasHeight: number;
  maxGridX: number;
  mouseGridPos: Point;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  addNode: () => void;
  deleteSelectedNode: () => void;
  requestRender: () => void;
  shouldRenderRef: React.MutableRefObject<boolean>;
  setContainerWidth: (width: number) => void;
  setMinHeight: (height: number) => void;
}

export function useCanvas(): UseCanvasReturn {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mouseGridPos, setMouseGridPos] = useState<Point>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);

  const shouldRenderRef = useRef(true);

  const maxGridX = getMaxGridX(containerWidth);
  const canvasHeight = calculateCanvasHeight(nodes, minHeight);

  const requestRender = useCallback(() => {
    shouldRenderRef.current = true;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const clickedNode = getNodeAtPoint(mouseX, mouseY, nodes);

      if (clickedNode) {
        setSelectedNodeId(clickedNode.id);
        setIsDragging(true);
      } else {
        setSelectedNodeId(null);
      }

      requestRender();
    },
    [nodes, requestRender]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gridPos = screenToGrid(mouseX, mouseY);
      setMouseGridPos(gridPos);

      if (isDragging && selectedNodeId) {
        const clampedX = clamp(gridPos.x, 0, maxGridX);
        const clampedY = Math.max(0, gridPos.y);

        setNodes((prev) =>
          prev.map((node) =>
            node.id === selectedNodeId
              ? { ...node, gridX: clampedX, gridY: clampedY }
              : node
          )
        );
        requestRender();
      }
    },
    [isDragging, selectedNodeId, maxGridX, requestRender]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const addNode = useCallback(() => {
    const position = findNextFreePosition(nodes, maxGridX);

    const newNode: CanvasNode = {
      id: generateNodeId(),
      gridX: position.x,
      gridY: position.y,
      size: 40,
      color: getRandomColor(),
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    requestRender();
  }, [nodes, maxGridX, requestRender]);

  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
      setSelectedNodeId(null);
      requestRender();
    }
  }, [selectedNodeId, requestRender]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement;
        if (!isInput) {
          deleteSelectedNode();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedNode]);

  return {
    nodes,
    selectedNodeId,
    isDragging,
    canvasHeight,
    maxGridX,
    mouseGridPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    addNode,
    deleteSelectedNode,
    requestRender,
    shouldRenderRef,
    setContainerWidth,
    setMinHeight,
  };
}
