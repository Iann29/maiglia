"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CanvasNode,
  type Point,
  type ResizeHandle,
  clamp,
  screenToGrid,
  getNodeAtPoint,
  generateNodeId,
  getRandomColor,
  calculateCanvasHeight,
  getMaxGridX,
  findNextFreePosition,
  getResizeHandleAtPoint,
  calculateResize,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from "./canvas-utils";

interface ResizePreview {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
}

interface UseCanvasReturn {
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  hoveredHandle: ResizeHandle;
  resizePreview: ResizePreview | null;
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
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle>(null);
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);
  const [mouseGridPos, setMouseGridPos] = useState<Point>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);

  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
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

      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        const handle = getResizeHandleAtPoint(mouseX, mouseY, selectedNode);
        if (handle) {
          setIsResizing(true);
          setActiveHandle(handle);
          setResizePreview({
            gridX: selectedNode.gridX,
            gridY: selectedNode.gridY,
            gridWidth: selectedNode.gridWidth,
            gridHeight: selectedNode.gridHeight,
          });
          requestRender();
          return;
        }
      }

      const clickedNode = getNodeAtPoint(mouseX, mouseY, nodes);

      if (clickedNode) {
        const gridPos = screenToGrid(mouseX, mouseY);
        dragOffsetRef.current = {
          x: gridPos.x - clickedNode.gridX,
          y: gridPos.y - clickedNode.gridY,
        };
        setSelectedNodeId(clickedNode.id);
        setIsDragging(true);
      } else {
        setSelectedNodeId(null);
      }

      requestRender();
    },
    [nodes, selectedNodeId, requestRender]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gridPos = screenToGrid(mouseX, mouseY);
      setMouseGridPos(gridPos);

      if (isResizing && selectedNodeId && activeHandle) {
        const selectedNode = nodes.find((n) => n.id === selectedNodeId);
        if (selectedNode) {
          const newBounds = calculateResize(selectedNode, activeHandle, gridPos, maxGridX);
          setResizePreview(newBounds);
          requestRender();
        }
        return;
      }

      if (isDragging && selectedNodeId) {
        const selectedNode = nodes.find((n) => n.id === selectedNodeId);
        if (selectedNode) {
          const targetX = gridPos.x - dragOffsetRef.current.x;
          const targetY = gridPos.y - dragOffsetRef.current.y;
          
          const clampedX = clamp(targetX, 0, maxGridX - selectedNode.gridWidth);
          const clampedY = Math.max(0, targetY);

          setNodes((prev) =>
            prev.map((node) =>
              node.id === selectedNodeId
                ? { ...node, gridX: clampedX, gridY: clampedY }
                : node
            )
          );
          requestRender();
        }
        return;
      }

      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        const handle = getResizeHandleAtPoint(mouseX, mouseY, selectedNode);
        if (handle !== hoveredHandle) {
          setHoveredHandle(handle);
          requestRender();
        }
      } else if (hoveredHandle) {
        setHoveredHandle(null);
        requestRender();
      }
    },
    [isDragging, isResizing, selectedNodeId, activeHandle, hoveredHandle, nodes, maxGridX, requestRender]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing && selectedNodeId && resizePreview) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                gridX: resizePreview.gridX,
                gridY: resizePreview.gridY,
                gridWidth: resizePreview.gridWidth,
                gridHeight: resizePreview.gridHeight,
              }
            : node
        )
      );
    }

    setIsDragging(false);
    setIsResizing(false);
    setActiveHandle(null);
    setResizePreview(null);
    requestRender();
  }, [isResizing, selectedNodeId, resizePreview, requestRender]);

  const addNode = useCallback(() => {
    const position = findNextFreePosition(nodes, maxGridX);

    const newNode: CanvasNode = {
      id: generateNodeId(),
      gridX: position.x,
      gridY: position.y,
      gridWidth: DEFAULT_NODE_WIDTH,
      gridHeight: DEFAULT_NODE_HEIGHT,
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
    deleteSelectedNode,
    requestRender,
    shouldRenderRef,
    setContainerWidth,
    setMinHeight,
  };
}
