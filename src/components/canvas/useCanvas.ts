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
  isPointInConfigIcon,
  getConfigIconBounds,
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
  hoveredNodeId: string | null;
  isConfigIconHovered: boolean;
  isDragging: boolean;
  isResizing: boolean;
  hoveredHandle: ResizeHandle;
  resizePreview: ResizePreview | null;
  canvasHeight: number;
  maxGridX: number;
  mouseGridPos: Point;
  configMenuNodeId: string | null;
  configMenuPosition: { x: number; y: number } | null;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  addNode: () => void;
  deleteSelectedNode: () => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  changeNodeColor: (nodeId: string, color: string) => void;
  closeConfigMenu: () => void;
  requestRender: () => void;
  shouldRenderRef: React.MutableRefObject<boolean>;
  setContainerWidth: (width: number) => void;
  setMinHeight: (height: number) => void;
}

export function useCanvas(): UseCanvasReturn {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isConfigIconHovered, setIsConfigIconHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle>(null);
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);
  const [mouseGridPos, setMouseGridPos] = useState<Point>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [minHeight, setMinHeight] = useState(0);
  const [configMenuNodeId, setConfigMenuNodeId] = useState<string | null>(null);
  const [configMenuPosition, setConfigMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const hoveredNodeIdRef = useRef<string | null>(null);
  const isConfigIconHoveredRef = useRef(false);
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

      // Verificar clique no ícone de config
      if (hoveredNodeIdRef.current && isConfigIconHoveredRef.current) {
        const node = nodes.find((n) => n.id === hoveredNodeIdRef.current);
        if (node) {
          const iconBounds = getConfigIconBounds(node);
          setConfigMenuNodeId(node.id);
          setConfigMenuPosition({
            x: rect.left + iconBounds.x + iconBounds.size / 2,
            y: rect.top + iconBounds.y + iconBounds.size / 2,
          });
          return;
        }
      }

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

      // Detectar hover no node e no ícone de config
      const nodeUnderMouse = getNodeAtPoint(mouseX, mouseY, nodes);
      const newHoveredId = nodeUnderMouse?.id ?? null;
      
      if (newHoveredId !== hoveredNodeId) {
        setHoveredNodeId(newHoveredId);
        hoveredNodeIdRef.current = newHoveredId;
        setIsConfigIconHovered(false);
        isConfigIconHoveredRef.current = false;
        requestRender();
      }

      // Verificar hover no ícone de config
      if (nodeUnderMouse) {
        const iconHovered = isPointInConfigIcon(mouseX, mouseY, nodeUnderMouse);
        if (iconHovered !== isConfigIconHovered) {
          setIsConfigIconHovered(iconHovered);
          isConfigIconHoveredRef.current = iconHovered;
          requestRender();
        }
      }
    },
    [isDragging, isResizing, selectedNodeId, activeHandle, hoveredHandle, hoveredNodeId, isConfigIconHovered, nodes, maxGridX, requestRender]
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

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    requestRender();
  }, [selectedNodeId, requestRender]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNode: CanvasNode = {
      id: generateNodeId(),
      gridX: nodeToDuplicate.gridX + 1,
      gridY: nodeToDuplicate.gridY + 1,
      gridWidth: nodeToDuplicate.gridWidth,
      gridHeight: nodeToDuplicate.gridHeight,
      color: nodeToDuplicate.color,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    requestRender();
  }, [nodes, requestRender]);

  const changeNodeColor = useCallback((nodeId: string, color: string) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, color } : node
      )
    );
    requestRender();
  }, [requestRender]);

  const closeConfigMenu = useCallback(() => {
    setConfigMenuNodeId(null);
    setConfigMenuPosition(null);
    isConfigIconHoveredRef.current = false;
  }, []);

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
    deleteSelectedNode,
    deleteNode,
    duplicateNode,
    changeNodeColor,
    closeConfigMenu,
    requestRender,
    shouldRenderRef,
    setContainerWidth,
    setMinHeight,
  };
}
