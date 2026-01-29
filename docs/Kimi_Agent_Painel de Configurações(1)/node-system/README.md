# 🎨 Sistema de Nodes - Maiglia (ATUALIZADO)

Sistema completo de nodes com **9 estilos visuais** totalmente customizáveis, inspirado no xTiles.

---

## ✨ O que mudou?

### Antes
- Nodes tinham apenas uma cor de fundo
- Estilos definidos mas não aplicados visualmente
- Header sempre com a cor do node

### Agora
- **9 estilos visuais completos** com cores de header, body, borda e texto
- Cada estilo tem sombras, bordas e separadores configuráveis
- Painel de configurações com tema escuro e checkmarks azuis

---

## 🎯 Os 9 Estilos de Cards

| ID | Nome | Header | Body | Uso Ideal |
|----|------|--------|------|-----------|
| 0 | **Escuro Azul** | #0984E3 | #2D3436 | Cards principais, destaque |
| 1 | **Escuro Cinza** | #636E72 | #2D3436 | Cards secundários |
| 2 | **Azul Claro** | #0984E3 | #74B9FF | Destaque azul vibrante |
| 3 | **Todo Escuro** | #2D3436 | #2D3436 | Modo escuro, código |
| 4 | **Cinza Escuro** | #2D3436 | #636E72 | Neutro, elegante |
| 5 | **Azul Branco** | #FFFFFF | #74B9FF | Clean, moderno |
| 6 | **Menta Branco** | #FFFFFF | #A8E6CF | Suave, relaxante |
| 7 | **Azul Vivo** | #FFFFFF | #0984E3 | Alto contraste |
| 8 | **Azul Suave** | #0984E3 | #74B9FF | Subtil, profissional |

---

## 📁 Arquivos

```
node-system/
├── canvas-types.ts          # Tipos atualizados (NodeStyle = 0-8)
├── constants.ts             # Definições dos 9 estilos + helpers
├── CanvasNode.tsx           # Node com aplicação de estilos
├── NodeHeader.tsx           # Header que respeita o estilo atual
├── NodeContent.tsx          # Conteúdo com cores do estilo
├── NodeSettingsPanel.tsx    # Painel de configurações (tema escuro)
├── demo.html                # Demonstração visual
└── README.md                # Este arquivo
```

---

## 🚀 Como Usar

### 1. Atualizar o tipo NodeStyle

```typescript
// canvas-types.ts
export type NodeStyle = 
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
```

### 2. Usar o helper getCardStyle

```typescript
import { getCardStyle } from "./constants";

const styleId = node.style ?? 0;
const cardStyle = getCardStyle(styleId);

// Agora você tem acesso a:
cardStyle.headerBg      // Cor do header
cardStyle.bodyBg        // Cor do body
cardStyle.borderColor   // Cor da borda
cardStyle.titleColor    // Cor do texto
cardStyle.shadow        // Sombra do card
// ... e mais!
```

### 3. Aplicar estilo no CanvasNode

```tsx
<div style={{
  border: `${cardStyle.borderWidth}px solid ${isSelected ? '#0984E3' : cardStyle.borderColor}`,
  boxShadow: isSelected 
    ? `0 0 0 3px rgba(9,132,227,0.3), ${cardStyle.shadow}` 
    : cardStyle.shadow,
}}>
  <NodeHeader node={node} ... />
  <NodeContent node={node} ... />
</div>
```

### 4. Atualizar o NodeSettingsPanel

```tsx
<NodeSettingsPanel
  isOpen={settingsOpen}
  position={settingsPosition}
  nodeId={node.id}
  currentIcon={node.icon}
  currentColor={node.color}
  currentTitleSize={node.titleSize ?? "M"}
  currentStyle={node.style ?? 0}  // ← NOVO!
  onClose={() => setSettingsOpen(false)}
  onStyleChange={(style) => updateNode(node.id, { style })}  // ← NOVO!
  // ... outras props
/>
```

---

## 🎨 Paleta de Cores

16 cores disponíveis no painel:

```typescript
const FULL_COLOR_PALETTE = [
  "#FF6B6B", "#FFB347", "#FFD93D", "#6BCB77",  // Quentes
  "#4D96FF", "#9B59B6", "#FF9FF3", "#A8E6CF",  // Frias
  "#FF8B94", "#FFC93C", "#C7F464", "#4ECDC4",  // Pasteis
  "#5D8AA8", "#DDA0DD", "#F8F8F8", "#2D3436",  // Neutras
];
```

---

## ✨ Features do Painel de Configurações

- ✅ **Tema escuro** (#1E1E1E)
- ✅ **Checkmark azul** nos itens selecionados
- ✅ **Seção de Estilo** com 9 miniaturas
- ✅ **Paleta de 16 cores** em 2 linhas
- ✅ **Botão "+Plus"** para cores personalizadas
- ✅ **Botão gradiente** para adicionar cor
- ✅ **Ações** Duplicar (branco) e Deletar (vermelho)

---

## 🔧 Estados Visuais dos Nodes

### Normal
- Sombra suave
- Borda padrão do estilo

### Hover
- Sombra mais forte
- Borda azul sutil (2px)

### Selecionado
- Sombra azul glow
- Borda azul (3px)
- Ring de seleção

---

## 📱 Responsividade

- Transições de 200ms em todas as propriedades
- Hover effects suaves
- Feedback visual imediato

---

## 🎯 Próximos Passos

1. **Integrar no projeto** - Substituir os arquivos antigos
2. **Testar** - Verificar se todos os estilos funcionam
3. **Adicionar mais estilos** - Se necessário, é fácil adicionar mais!

---

Feito com ❤️ para o Maiglia
