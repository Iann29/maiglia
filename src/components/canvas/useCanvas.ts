"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  easeOutCubic,
  isOriginVisible,
} from "./canvas-utils";

interface CameraAnimation {
  startTime: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

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
  isAnimating: boolean;
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [mouseGridPos, setMouseGridPos] = useState<Point>({ x: 0, y: 0 });

  const lastMousePos = useRef<Point>({ x: 0, y: 0 });
  const animationRef = useRef<CameraAnimation | null>(null);
  const shouldRenderRef = useRef(true);

  const requestRender = useCallback(() => {
    shouldRenderRef.current = true;
  }, []);

  const cancelAnimation = useCallback(() => {
    animationRef.current = null;
    setIsAnimating(false);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || !animationRef.current) return;

    let frameId: number;
    let cancelled = false;

    const animate = () => {
      if (cancelled || !animationRef.current) return;

      const { startTime, duration, startX, startY, endX, endY } = animationRef.current;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setCamera((prev) => ({
        ...prev,
        x: startX + (endX - startX) * eased,
        y: startY + (endY - startY) * eased,
      }));

      requestRender();

      if (progress >= 1) {
        animationRef.current = null;
        setIsAnimating(false);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [isAnimating, requestRender]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Cancelar animação se usuário interagir
      if (isAnimating) cancelAnimation();

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
    [nodes, camera, isAnimating, cancelAnimation, requestRender]
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

      // Cancelar animação se usuário interagir
      if (isAnimating) cancelAnimation();

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
    [camera, isAnimating, cancelAnimation, requestRender]
  );

  const addNode = useCallback(
    (containerWidth: number, containerHeight: number) => {
      // SEMPRE cria nó na origem (0, 0)
      const newNode: CanvasNode = {
        id: generateNodeId(),
        gridX: 0,
        gridY: 0,
        size: 40,
        color: getRandomColor(),
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newNode.id);

      // Se origem não está visível, anima a camera até ela
      if (!isOriginVisible(camera, containerWidth, containerHeight)) {
        animationRef.current = {
          startTime: performance.now(),
          duration: 400,
          startX: camera.x,
          startY: camera.y,
          endX: containerWidth / 2,
          endY: containerHeight / 2,
        };
        setIsAnimating(true);
      }

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
    isAnimating,
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
