import { create } from "zustand";
import { generateKeyBetween } from "fractional-indexing";
import {
  type CanvasNode,
  type TitleAlign,
  generateNodeId,
  getRandomColor,
  snapToGrid,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  GRID_SIZE,
  CANVAS_PADDING,
} from "./canvas-types";

interface ConfigMenuState {
  nodeId: string;
  position: { x: number; y: number; nodeLeft?: number };
}

interface CanvasState {
  nodes: CanvasNode[];
  selectedNodeIds: string[]; // Suporta seleção múltipla
  editingNodeId: string | null;
  configMenu: ConfigMenuState | null;
  containerWidth: number;
  containerHeight: number;
}

interface CanvasActions {
  // Node CRUD (local - para uso interno, NÃO persiste no banco)
  addNode: () => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  duplicateNode: (id: string) => void;

  // Sincronização com Convex (para uso pelo hook useNodes)
  setNodes: (nodes: CanvasNode[]) => void;
  addNodeLocal: (node: CanvasNode) => void;
  updateNodeLocal: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNodeLocal: (id: string) => void;

  // Selection
  selectNode: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;

  // Title editing
  startEditingTitle: (id: string) => void;
  saveTitle: (id: string, title: string, align?: TitleAlign) => void;
  stopEditingTitle: () => void;

  // Config menu
  openConfigMenu: (nodeId: string, position: { x: number; y: number; nodeLeft?: number }) => void;
  closeConfigMenu: () => void;

  // Layers
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // Color
  changeColor: (id: string, color: string) => void;

  // Batch update (para movimento em grupo)
  updateMultipleNodes: (updates: Array<{id: string, updates: Partial<CanvasNode>}>) => void;

  // Container
  setContainerSize: (width: number, height: number) => void;
}

function sortNodesByIndex(nodes: CanvasNode[]): CanvasNode[] {
  return [...nodes].sort((a, b) => a.index.localeCompare(b.index));
}

function findNextFreePosition(
  nodes: CanvasNode[],
  containerWidth: number
): { x: number; y: number } {
  const maxX = containerWidth - DEFAULT_NODE_WIDTH - CANVAS_PADDING;

  if (nodes.length === 0) {
    return { x: CANVAS_PADDING, y: CANVAS_PADDING };
  }

  // Tenta encontrar posição livre em grid
  const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + GRID_SIZE;

  for (let y = CANVAS_PADDING; y <= maxY; y += GRID_SIZE) {
    for (let x = CANVAS_PADDING; x <= maxX; x += GRID_SIZE) {
      const overlaps = nodes.some((node) => {
        const nodeRight = node.x + node.width;
        const nodeBottom = node.y + node.height;
        const testRight = x + DEFAULT_NODE_WIDTH;
        const testBottom = y + DEFAULT_NODE_HEIGHT;

        return (
          x < nodeRight &&
          testRight > node.x &&
          y < nodeBottom &&
          testBottom > node.y
        );
      });

      if (!overlaps) {
        return { x, y };
      }
    }
  }

  return { x: CANVAS_PADDING, y: maxY + GRID_SIZE };
}

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  // Initial state
  nodes: [],
  selectedNodeIds: [],
  editingNodeId: null,
  configMenu: null,
  containerWidth: 0,
  containerHeight: 0,

  // Actions
  addNode: () => {
    const { nodes, containerWidth } = get();
    const position = findNextFreePosition(nodes, containerWidth);

    const newNode: CanvasNode = {
      id: generateNodeId(),
      x: position.x,
      y: position.y,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
      color: getRandomColor(),
      index: generateKeyBetween(
        nodes.length > 0
          ? sortNodesByIndex(nodes)[nodes.length - 1].index
          : null,
        null
      ),
      title: "",
      titleAlign: "center",
    };

    set({ nodes: [...nodes, newNode], selectedNodeIds: [newNode.id] });
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id),
      editingNodeId: state.editingNodeId === id ? null : state.editingNodeId,
      configMenu: state.configMenu?.nodeId === id ? null : state.configMenu,
    }));
  },

  deleteSelectedNodes: () => {
    const { selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;
    
    set((state) => ({
      nodes: state.nodes.filter((node) => !selectedNodeIds.includes(node.id)),
      selectedNodeIds: [],
      editingNodeId: selectedNodeIds.includes(state.editingNodeId ?? "") ? null : state.editingNodeId,
      configMenu: state.configMenu && selectedNodeIds.includes(state.configMenu.nodeId) ? null : state.configMenu,
    }));
  },

  duplicateNode: (id) => {
    const { nodes } = get();
    const nodeToDuplicate = nodes.find((n) => n.id === id);
    if (!nodeToDuplicate) return;

    const newNode: CanvasNode = {
      ...nodeToDuplicate,
      id: generateNodeId(),
      x: snapToGrid(nodeToDuplicate.x + GRID_SIZE),
      y: snapToGrid(nodeToDuplicate.y + GRID_SIZE),
      index: generateKeyBetween(
        sortNodesByIndex(nodes)[nodes.length - 1].index,
        null
      ),
    };

    set({ nodes: [...nodes, newNode], selectedNodeIds: [newNode.id] });
  },

  selectNode: (id) => {
    set({ selectedNodeIds: id ? [id] : [] });
  },

  selectNodes: (ids) => {
    set({ selectedNodeIds: ids });
  },

  toggleNodeSelection: (id) => {
    set((state) => {
      const isSelected = state.selectedNodeIds.includes(id);
      if (isSelected) {
        // Remove da seleção
        return { selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id) };
      } else {
        // Adiciona à seleção
        return { selectedNodeIds: [...state.selectedNodeIds, id] };
      }
    });
  },

  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },

  startEditingTitle: (id) => {
    set({ editingNodeId: id, selectedNodeIds: [id] });
  },

  saveTitle: (id, title, align) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, title, titleAlign: align ?? node.titleAlign }
          : node
      ),
      editingNodeId: null,
    }));
  },

  stopEditingTitle: () => {
    set({ editingNodeId: null });
  },

  openConfigMenu: (nodeId, position) => {
    set({ configMenu: { nodeId, position }, selectedNodeIds: [nodeId] });
  },

  closeConfigMenu: () => {
    set({ configMenu: null });
  },

  bringToFront: (id) => {
    const { nodes } = get();
    const sorted = sortNodesByIndex(nodes);
    const node = sorted.find((n) => n.id === id);
    if (!node) return;

    const topIndex = sorted[sorted.length - 1].index;
    if (node.index === topIndex) return;

    const newIndex = generateKeyBetween(topIndex, null);
    set({
      nodes: nodes.map((n) => (n.id === id ? { ...n, index: newIndex } : n)),
    });
  },

  sendToBack: (id) => {
    const { nodes } = get();
    const sorted = sortNodesByIndex(nodes);
    const node = sorted.find((n) => n.id === id);
    if (!node) return;

    const bottomIndex = sorted[0].index;
    if (node.index === bottomIndex) return;

    const newIndex = generateKeyBetween(null, bottomIndex);
    set({
      nodes: nodes.map((n) => (n.id === id ? { ...n, index: newIndex } : n)),
    });
  },

  bringForward: (id) => {
    const { nodes } = get();
    const sorted = sortNodesByIndex(nodes);
    const currentIdx = sorted.findIndex((n) => n.id === id);
    if (currentIdx === -1 || currentIdx === sorted.length - 1) return;

    const nodeAbove = sorted[currentIdx + 1];
    const nodeAboveAbove = sorted[currentIdx + 2];

    const newIndex = generateKeyBetween(
      nodeAbove.index,
      nodeAboveAbove?.index ?? null
    );

    set({
      nodes: nodes.map((n) => (n.id === id ? { ...n, index: newIndex } : n)),
    });
  },

  sendBackward: (id) => {
    const { nodes } = get();
    const sorted = sortNodesByIndex(nodes);
    const currentIdx = sorted.findIndex((n) => n.id === id);
    if (currentIdx === -1 || currentIdx === 0) return;

    const nodeBelow = sorted[currentIdx - 1];
    const nodeBelowBelow = sorted[currentIdx - 2];

    const newIndex = generateKeyBetween(
      nodeBelowBelow?.index ?? null,
      nodeBelow.index
    );

    set({
      nodes: nodes.map((n) => (n.id === id ? { ...n, index: newIndex } : n)),
    });
  },

  changeColor: (id, color) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, color } : node
      ),
    }));
  },

  // Atualiza múltiplos nodes de uma vez (para movimento em grupo)
  updateMultipleNodes: (updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        const update = updates.find((u) => u.id === node.id);
        return update ? { ...node, ...update.updates } : node;
      }),
    }));
  },

  setContainerSize: (width, height) => {
    set({ containerWidth: width, containerHeight: height });
  },

  // === Funções de sincronização com Convex ===

  // Substitui todos os nodes (usado quando dados chegam do Convex)
  setNodes: (nodes) => {
    set({ nodes, selectedNodeIds: [], editingNodeId: null, configMenu: null });
  },

  // Adiciona node localmente (já criado no Convex)
  addNodeLocal: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
      selectedNodeIds: [node.id],
    }));
  },

  // Atualiza node localmente (para UI responsiva antes do Convex)
  updateNodeLocal: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  },

  // Remove node localmente (chamado após sync com Convex)
  deleteNodeLocal: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id),
      editingNodeId: state.editingNodeId === id ? null : state.editingNodeId,
      configMenu: state.configMenu?.nodeId === id ? null : state.configMenu,
    }));
  },
}));
