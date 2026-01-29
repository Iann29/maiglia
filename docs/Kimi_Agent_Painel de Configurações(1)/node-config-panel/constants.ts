/**
 * Constantes do Painel de Configurações de Node - Maiglia
 * 
 * Valores padrão para ícones
 */

import type { IconPosition, IconSize, IconStyle } from "./types";

// ============================================
// POSIÇÕES DO ÍCONE (Grid 3x3)
// ============================================

export const ICON_POSITIONS: { value: IconPosition; label: string }[] = [
  { value: "top-left", label: "⬉" },
  { value: "top-center", label: "⬆" },
  { value: "top-right", label: "⬈" },
  { value: "center-left", label: "⬅" },
  { value: "center", label: "⏺" },
  { value: "center-right", label: "➡" },
  { value: "bottom-left", label: "⬋" },
  { value: "bottom-center", label: "⬇" },
  { value: "bottom-right", label: "⬊" },
];

// Mapeamento de posições para estilos CSS
export const ICON_POSITION_STYLES: Record<IconPosition, React.CSSProperties> = {
  "top-left": { position: "absolute", top: 8, left: 8 },
  "top-center": { position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" },
  "top-right": { position: "absolute", top: 8, right: 8 },
  "center-left": { position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)" },
  "center": { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  "center-right": { position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)" },
  "bottom-left": { position: "absolute", bottom: 8, left: 8 },
  "bottom-center": { position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)" },
  "bottom-right": { position: "absolute", bottom: 8, right: 8 },
};

// ============================================
// TAMANHOS DO ÍCONE
// ============================================

export const ICON_SIZES: { value: IconSize; label: string; px: number }[] = [
  { value: "XS", label: "XS", px: 16 },
  { value: "S", label: "S", px: 20 },
  { value: "M", label: "M", px: 24 },
  { value: "L", label: "L", px: 32 },
  { value: "XL", label: "XL", px: 40 },
];

// Helper para obter tamanho em px
export function getIconSizeInPixels(size: IconSize): number {
  const found = ICON_SIZES.find((s) => s.value === size);
  return found?.px ?? 24;
}

// ============================================
// ESTILOS DO ÍCONE
// ============================================

export const ICON_STYLES: { value: IconStyle; label: string; icon: string }[] = [
  { value: "normal", label: "Normal", icon: "😊" },
  { value: "background", label: "Com fundo", icon: "⬜" },
  { value: "border", label: "Com borda", icon: "⬛" },
  { value: "shadow", label: "Com sombra", icon: "✨" },
];

// Helper para gerar estilos CSS do ícone baseado no estilo selecionado
export function getIconStyleCSS(
  style: IconStyle,
  baseColor: string = "#FFFFFF"
): React.CSSProperties {
  const base: React.CSSProperties = {
    transition: "all 0.2s ease",
  };

  switch (style) {
    case "background":
      return {
        ...base,
        backgroundColor: `${baseColor}33`, // 20% opacity
        padding: "4px 8px",
        borderRadius: 8,
      };
    case "border":
      return {
        ...base,
        border: `2px solid ${baseColor}4D`, // 30% opacity
        padding: "2px 6px",
        borderRadius: 6,
      };
    case "shadow":
      return {
        ...base,
        textShadow: `0 2px 8px rgba(0,0,0,0.4)`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
      };
    default:
      return base;
  }
}

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================

export const DEFAULT_ICON_CONFIG = {
  iconPosition: "top-center" as IconPosition,
  iconSize: "M" as IconSize,
  iconStyle: "normal" as IconStyle,
};
