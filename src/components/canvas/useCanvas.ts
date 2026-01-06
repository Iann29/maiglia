"use client";

import { useCallback, useRef, useState } from "react";
import {
  type Camera,
  type CanvasNode,
  type Point,
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_SENSITIVITY,
  clamp,
  screenToWorld,
  getNodeAtPoint,
  generateNodeId,
  getRandomColor,
  worldToGrid,
} from "./canvas-utils";

function getInitialCamera(): Camera {
  if (typeof window === "undefined") return { x: 0, y: 0, scale: 1 };
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    scale: 1,
  };
}

interface UseCanvasReturn {
  camera: Camera;
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  isDragging: boolean;
  isPanning: boolean;
  mouseGridPos: Point;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  addNode: (containerWidth: number, containerHeight: number) => void;
  deleteSelectedNode: () => void;
  resetCamera: (containerWidth: number, containerHeight: number) => void;
  requestRender: () => void;
  shouldRenderRef: React.MutableRefObject<boolean>;
}

export function useCanvas(): UseCanvasReturn {
  const [camera, setCamera] = useState<Camera>(getInitialCamera);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [mouseGridPos, setMouseGridPos] = useState<Point>({ x: 0, y: 0 });

  const lastMousePos = useRef<Point>({ x: 0, y: 0 });
  const shouldRenderRef = useRef(true);

  const requestRender = useCallback(() => {
    shouldRenderRef.current = true;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mousePos: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      lastMousePos.current = mousePos;

      const clickedNode = getNodeAtPoint(mousePos, nodes, camera);

      if (clickedNode) {
        setSelectedNodeId(clickedNode.id);
        setIsDragging(true);
      } else {
        setSelectedNodeId(null);
        setIsPanning(true);
      }

      requestRender();
    },
    [nodes, camera, requestRender]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mousePos: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const dx = mousePos.x - lastMousePos.current.x;
      const dy = mousePos.y - lastMousePos.current.y;

      // Atualizar posição do mouse em coordenadas de grid
      const worldPos = screenToWorld(mousePos.x, mousePos.y, camera);
      const gridPos = worldToGrid(worldPos.x, worldPos.y);
      setMouseGridPos(gridPos);

      if (isPanning) {
        setCamera((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        requestRender();
      } else if (isDragging && selectedNodeId) {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === selectedNodeId
              ? { ...node, gridX: gridPos.x, gridY: gridPos.y }
              : node
          )
        );
        requestRender();
      }

      lastMousePos.current = mousePos;
    },
    [isPanning, isDragging, selectedNodeId, camera, requestRender]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = 1 - e.deltaY * ZOOM_SENSITIVITY;
      const newScale = clamp(camera.scale * zoomFactor, MIN_SCALE, MAX_SCALE);

      const worldBeforeZoom = screenToWorld(mouseX, mouseY, camera);
      const worldAfterZoom = screenToWorld(mouseX, mouseY, {
        ...camera,
        scale: newScale,
      });

      setCamera((prev) => ({
        x: prev.x + (worldAfterZoom.x - worldBeforeZoom.x) * newScale,
        y: prev.y + (worldAfterZoom.y - worldBeforeZoom.y) * newScale,
        scale: newScale,
      }));

      requestRender();
    },
    [camera, requestRender]
  );

  const addNode = useCallback(
    (containerWidth: number, containerHeight: number) => {
      // Adicionar nó no centro da visualização atual (em coordenadas de grid)
      const centerWorldX = (containerWidth / 2 - camera.x) / camera.scale;
      const centerWorldY = (containerHeight / 2 - camera.y) / camera.scale;
      const gridPos = worldToGrid(centerWorldX, centerWorldY);

      const newNode: CanvasNode = {
        id: generateNodeId(),
        gridX: gridPos.x,
        gridY: gridPos.y,
        size: 40,
        color: getRandomColor(),
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
      requestRender();
    },
    [camera, requestRender]
  );

  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
      setSelectedNodeId(null);
      requestRender();
    }
  }, [selectedNodeId, requestRender]);

  const resetCamera = useCallback(
    (containerWidth: number, containerHeight: number) => {
      setCamera({
        x: containerWidth / 2,
        y: containerHeight / 2,
        scale: 1,
      });
      requestRender();
    },
    [requestRender]
  );

  return {
    camera,
    nodes,
    selectedNodeId,
    isDragging,
    isPanning,
    mouseGridPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    addNode,
    deleteSelectedNode,
    resetCamera,
    requestRender,
    shouldRenderRef,
  };
}
