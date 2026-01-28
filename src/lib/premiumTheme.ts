/**
 * Sistema de Temas - Maiglia
 *
 * Gerencia a aplicação dinâmica de temas, incluindo cores e fontes.
 * Sistema unificado: não existe mais separação entre light/dark e temas premium.
 * Cada tema define todas as suas cores (se é claro ou escuro é parte do tema).
 */

// Tipo que representa as cores de um tema
export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  fgPrimary: string;
  fgSecondary: string;
  accent: string;
  accentHover: string;
}

// Tipo completo de um tema (baseado no schema Convex)
export interface PremiumTheme {
  _id: string;
  name: string;
  slug: string;
  description: string;
  previewUrl?: string;
  colors: ThemeColors;
  font: string;
  isDefault: boolean;
  price: number;
  createdAt: number;
}

// Cores padrão do tema light (fallback)
export const DEFAULT_LIGHT_COLORS: ThemeColors = {
  bgPrimary: "#ffffff",
  bgSecondary: "#f9fafb",
  fgPrimary: "#111827",
  fgSecondary: "#4b5563",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
};

// Cores padrão do tema dark (fallback)
export const DEFAULT_DARK_COLORS: ThemeColors = {
  bgPrimary: "#0a0a0a",
  bgSecondary: "#111111",
  fgPrimary: "#f9fafb",
  fgSecondary: "#9ca3af",
  accent: "#3b82f6",
  accentHover: "#2563eb",
};

/**
 * Aplica as cores de um tema premium nas CSS variables do documento
 * Funciona em conjunto com o sistema light/dark existente
 */
export function applyPremiumThemeColors(colors: ThemeColors): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Aplicar cores principais
  root.style.setProperty("--bg-primary", colors.bgPrimary);
  root.style.setProperty("--bg-secondary", colors.bgSecondary);
  root.style.setProperty("--fg-primary", colors.fgPrimary);
  root.style.setProperty("--fg-secondary", colors.fgSecondary);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-hover", colors.accentHover);

  // Cores derivadas (tertiary, muted, borders) baseadas nas cores principais
  root.style.setProperty("--bg-tertiary", adjustBrightness(colors.bgSecondary, -5));
  root.style.setProperty("--bg-canvas", colors.bgPrimary);
  root.style.setProperty("--fg-muted", adjustBrightness(colors.fgSecondary, 20));
  root.style.setProperty("--border-primary", adjustBrightness(colors.bgSecondary, -10));
  root.style.setProperty("--border-secondary", adjustBrightness(colors.bgSecondary, -5));

  // Legacy (compatibilidade)
  root.style.setProperty("--background", colors.bgPrimary);
  root.style.setProperty("--foreground", colors.fgPrimary);
}

/**
 * Aplica a fonte de um tema premium
 */
export function applyPremiumThemeFont(fontFamily: string): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--theme-font-family", fontFamily);

  // Também atualiza o font-sans para integrar com Tailwind
  root.style.setProperty("--font-sans", `${fontFamily}, var(--font-geist-sans), Arial, Helvetica, sans-serif`);
}

/**
 * Aplica um tema completo (cores + fonte)
 * Todos os temas (incluindo defaults) aplicam suas cores via CSS variables
 */
export function applyPremiumTheme(theme: PremiumTheme | null): void {
  if (!theme) {
    // Fallback: aplicar cores do tema light padrão
    applyPremiumThemeColors(DEFAULT_LIGHT_COLORS);
    return;
  }

  // Aplicar cores e fonte do tema (todos os temas, inclusive defaults)
  applyPremiumThemeColors(theme.colors);
  applyPremiumThemeFont(theme.font);
}

/**
 * Ajusta o brilho de uma cor hex
 */
function adjustBrightness(hex: string, percent: number): string {
  // Remove # se presente
  const cleanHex = hex.replace("#", "");

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Ajusta brilho
  const adjust = (value: number) => {
    const adjusted = value + (percent * 255) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  // Converte de volta para hex
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
