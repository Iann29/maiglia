/**
 * Tipos do Painel de Configurações de Node - Maiglia
 * 
 * Versão enxuta: apenas configurações de ÍCONE
 */

// Posições do ícone no grid 3x3
export type IconPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// Tamanhos pré-definidos do ícone
export type IconSize = "XS" | "S" | "M" | "L" | "XL";

// Estilos visuais do ícone
export type IconStyle = "normal" | "background" | "border" | "shadow";

// Configurações de ícone do node
export interface NodeIconConfig {
  icon?: string;              // Emoji/ícone (ex: "🍋")
  iconPosition: IconPosition; // Posição no card
  iconSize: IconSize;         // Tamanho pré-definido
  iconStyle: IconStyle;       // Estilo visual
}

// Props do painel de configurações
export interface NodeSettingsPanelProps {
  isOpen: boolean;
  position: { 
    x: number; 
    y: number; 
    nodeLeft?: number;
  };
  nodeId: string;
  config: NodeIconConfig;
  onClose: () => void;
  onConfigChange: (config: Partial<NodeIconConfig>) => void;
  onIconClick: () => void;
  onRemoveIcon: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}
