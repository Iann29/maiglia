import { create } from "zustand";

interface ConfigMenuState {
  nodeId: string;
  position: { x: number; y: number; nodeLeft?: number };
}

/**
 * Store do Canvas - apenas estado de UI
 * 
 * NOTA: Os dados dos nodes vêm diretamente do Convex via useNodes hook.
 * Este store gerencia apenas estado de UI: seleção, edição, menus, etc.
 */
interface CanvasState {
  // Seleção de nodes
  selectedNodeIds: string[];
  
  // Edição de título
  editingNodeId: string | null;
  
  // Menu de configuração
  configMenu: ConfigMenuState | null;
  
  // Dimensões do container
  containerWidth: number;
  containerHeight: number;
}

interface CanvasActions {
  // Seleção
  selectNode: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Edição de título
  startEditingTitle: (id: string) => void;
  stopEditingTitle: () => void;
  
  // Menu de configuração
  openConfigMenu: (nodeId: string, position: { x: number; y: number; nodeLeft?: number }) => void;
  closeConfigMenu: () => void;
  
  // Container
  setContainerSize: (width: number, height: number) => void;
  
  // Limpar seleção ao deletar nodes
  removeFromSelection: (nodeIds: string[]) => void;
}

export const useCanvasStore = create<CanvasState & CanvasActions>((set) => ({
  // Estado inicial
  selectedNodeIds: [],
  editingNodeId: null,
  configMenu: null,
  containerWidth: 0,
  containerHeight: 0,

  // === Ações de Seleção ===

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
        return { selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id) };
      } else {
        return { selectedNodeIds: [...state.selectedNodeIds, id] };
      }
    });
  },

  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },

  // === Ações de Edição ===

  startEditingTitle: (id) => {
    set({ editingNodeId: id, selectedNodeIds: [id] });
  },

  stopEditingTitle: () => {
    set({ editingNodeId: null });
  },

  // === Ações de Menu ===

  openConfigMenu: (nodeId, position) => {
    set({ configMenu: { nodeId, position }, selectedNodeIds: [nodeId] });
  },

  closeConfigMenu: () => {
    set({ configMenu: null });
  },

  // === Ações de Container ===

  setContainerSize: (width, height) => {
    set({ containerWidth: width, containerHeight: height });
  },

  // === Helpers ===

  removeFromSelection: (nodeIds) => {
    set((state) => {
      const nodeIdSet = new Set(nodeIds);
      return {
        selectedNodeIds: state.selectedNodeIds.filter((id) => !nodeIdSet.has(id)),
        editingNodeId: state.editingNodeId && nodeIdSet.has(state.editingNodeId) ? null : state.editingNodeId,
        configMenu: state.configMenu && nodeIdSet.has(state.configMenu.nodeId) ? null : state.configMenu,
      };
    });
  },
}));
