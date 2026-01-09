import { generateKeyBetween } from "fractional-indexing";
import type { CanvasNode } from "./canvas-utils";

export function sortNodesByIndex(nodes: CanvasNode[]): CanvasNode[] {
  return [...nodes].sort((a, b) => a.index.localeCompare(b.index));
}

export function generateTopIndex(nodes: CanvasNode[]): string {
  if (nodes.length === 0) return generateKeyBetween(null, null);
  const sorted = sortNodesByIndex(nodes);
  const topIndex = sorted[sorted.length - 1].index;
  return generateKeyBetween(topIndex, null);
}

export function bringToFront(nodes: CanvasNode[], nodeId: string): CanvasNode[] {
  const sorted = sortNodesByIndex(nodes);
  const node = sorted.find((n) => n.id === nodeId);
  if (!node) return nodes;

  const topIndex = sorted[sorted.length - 1].index;
  if (node.index === topIndex) return nodes;

  const newIndex = generateKeyBetween(topIndex, null);
  return nodes.map((n) => (n.id === nodeId ? { ...n, index: newIndex } : n));
}

export function sendToBack(nodes: CanvasNode[], nodeId: string): CanvasNode[] {
  const sorted = sortNodesByIndex(nodes);
  const node = sorted.find((n) => n.id === nodeId);
  if (!node) return nodes;

  const bottomIndex = sorted[0].index;
  if (node.index === bottomIndex) return nodes;

  const newIndex = generateKeyBetween(null, bottomIndex);
  return nodes.map((n) => (n.id === nodeId ? { ...n, index: newIndex } : n));
}

export function bringForward(nodes: CanvasNode[], nodeId: string): CanvasNode[] {
  const sorted = sortNodesByIndex(nodes);
  const currentIdx = sorted.findIndex((n) => n.id === nodeId);
  if (currentIdx === -1 || currentIdx === sorted.length - 1) return nodes;

  const nodeAbove = sorted[currentIdx + 1];
  const nodeAboveAbove = sorted[currentIdx + 2];

  const newIndex = generateKeyBetween(
    nodeAbove.index,
    nodeAboveAbove?.index ?? null
  );

  return nodes.map((n) => (n.id === nodeId ? { ...n, index: newIndex } : n));
}

export function sendBackward(nodes: CanvasNode[], nodeId: string): CanvasNode[] {
  const sorted = sortNodesByIndex(nodes);
  const currentIdx = sorted.findIndex((n) => n.id === nodeId);
  if (currentIdx === -1 || currentIdx === 0) return nodes;

  const nodeBelow = sorted[currentIdx - 1];
  const nodeBelowBelow = sorted[currentIdx - 2];

  const newIndex = generateKeyBetween(
    nodeBelowBelow?.index ?? null,
    nodeBelow.index
  );

  return nodes.map((n) => (n.id === nodeId ? { ...n, index: newIndex } : n));
}
