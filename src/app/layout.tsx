import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maiglia",
  description: "Maiglia App",
};

// Script de hidratação de tema - executa antes do React para evitar FOUC
// Lê o slug do tema do cache e aplica as cores imediatamente
// NOTA: A chave 'maiglia-active-theme-slug' deve corresponder a THEME_CACHE_KEY em src/lib/premiumTheme.ts
const themeHydrationScript = `
(function() {
  try {
    var T = {
      'default-light': { bg: '#ffffff', bg2: '#f9fafb', fg: '#111827', fg2: '#4b5563', ac: '#2563eb', ac2: '#1d4ed8', cg: '#d4d4d4', nc: ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'] },
      'default-dark': { bg: '#0a0a0a', bg2: '#111111', fg: '#f9fafb', fg2: '#9ca3af', ac: '#3b82f6', ac2: '#2563eb', cg: '#333333', nc: ['#f87171','#fb923c','#facc15','#4ade80','#22d3ee','#60a5fa','#a78bfa','#f472b6'] },
      'ocean': { bg: '#0c1929', bg2: '#0f2942', fg: '#e2f1ff', fg2: '#8ec5fc', ac: '#00d9ff', ac2: '#00b8d9', cg: '#1e3a5f', nc: ['#0ea5e9','#06b6d4','#14b8a6','#22d3ee','#38bdf8','#67e8f9','#0891b2','#0d9488'] },
      'forest': { bg: '#1a2f23', bg2: '#243d2e', fg: '#e8f5e9', fg2: '#a5d6a7', ac: '#4caf50', ac2: '#388e3c', cg: '#2d4a37', nc: ['#22c55e','#16a34a','#84cc16','#65a30d','#4ade80','#a3e635','#15803d','#166534'] },
      'sunset': { bg: '#2d1f2f', bg2: '#3d2a40', fg: '#fff3e8', fg2: '#ffb88c', ac: '#ff6b6b', ac2: '#ee5a5a', cg: '#4a3545', nc: ['#f43f5e','#fb7185','#f97316','#fb923c','#fbbf24','#f472b6','#ec4899','#e11d48'] },
      'midnight': { bg: '#1a1a2e', bg2: '#25254a', fg: '#eef2ff', fg2: '#a5b4fc', ac: '#8b5cf6', ac2: '#7c3aed', cg: '#363663', nc: ['#8b5cf6','#a78bfa','#c084fc','#818cf8','#6366f1','#a855f7','#7c3aed','#6d28d9'] }
    };
    function adj(h, p) {
      var x = h.replace('#', '');
      var r = parseInt(x.substring(0,2), 16), g = parseInt(x.substring(2,4), 16), b = parseInt(x.substring(4,6), 16);
      function a(v) { return Math.max(0, Math.min(255, Math.round(v + (p * 255) / 100))); }
      return '#' + a(r).toString(16).padStart(2,'0') + a(g).toString(16).padStart(2,'0') + a(b).toString(16).padStart(2,'0');
    }
    var slug = localStorage.getItem('maiglia-active-theme-slug') || 'default-light';
    var c = T[slug] || T['default-light'];
    var s = document.documentElement.style;
    s.setProperty('--bg-primary', c.bg);
    s.setProperty('--bg-secondary', c.bg2);
    s.setProperty('--fg-primary', c.fg);
    s.setProperty('--fg-secondary', c.fg2);
    s.setProperty('--accent', c.ac);
    s.setProperty('--accent-hover', c.ac2);
    s.setProperty('--bg-tertiary', adj(c.bg2, -5));
    s.setProperty('--canvas-bg', c.bg);
    s.setProperty('--fg-muted', adj(c.fg2, 20));
    s.setProperty('--border-primary', adj(c.bg2, -10));
    s.setProperty('--border-secondary', adj(c.bg2, -5));
    s.setProperty('--background', c.bg);
    s.setProperty('--foreground', c.fg);
    s.setProperty('--canvas-grid', c.cg);
    for (var i = 0; i < c.nc.length; i++) { s.setProperty('--node-color-' + (i + 1), c.nc[i]); }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeHydrationScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
