# 🎨 Plano: Painel de Configurações Enriquecido

## Visão Geral

Transformar o painel de configurações em um **estúdio de design completo** para nodes, similar ao Figma/Notion/xTiles.

---

## 📋 Seções do Novo Painel

### 1️⃣ ÍCONE (Expandido)

#### Posição do Ícone
```
┌─────────┬─────────┬─────────┐
│  Topo   │ Centro  │ Base    │
│ Esquerda│         │ Direita │
├─────────┼─────────┼─────────┤
│  Topo   │ Centro  │ Base    │
│ Centro  │         │ Centro  │
├─────────┼─────────┼─────────┤
│  Topo   │ Centro  │ Base    │
│ Direita │         │ Esquerda│
└─────────┴─────────┴─────────┘
```
- **9 posições** no grid 3x3
- Padrão: Topo Centro

#### Tamanho do Ícone
- **Slider**: 16px a 48px
- **Presets**: XS (16) | S (20) | M (24) | L (32) | XL (40)

#### Estilo do Ícone
- 😊 **Normal** (padrão)
- 😎 **Com fundo** (círculo/quadrado atrás)
- 🎨 **Com borda** (borda colorida)
- ✨ **Com sombra** (sombra suave)

---

### 2️⃣ TÍTULO (Expandido)

#### Posição do Título (Horizontal)
- ⬅️ **Esquerda**
- ⏺️ **Centro** (padrão)
- ➡️ **Direita**

#### Posição do Título (Vertical)
- ⬆️ **Topo** (padrão)
- ⏺️ **Centro** (no meio do header)
- ⬇️ **Base** (na parte inferior)

#### Tamanho da Fonte
- **Slider**: 10px a 32px
- **Presets**: XS (10) | S (12) | M (14) | L (18) | XL (24) | XXL (32)

#### Peso da Fonte
- **Thin** (100)
- **Light** (300)
- **Regular** (400) - padrão
- **Medium** (500)
- **Semibold** (600)
- **Bold** (700)
- **Black** (900)

#### Cor do Texto
- 🎨 **Picker de cor** completo
- **Presets**: Branco | Preto | Cor do header | Personalizada

#### Transformação de Texto
- **Normal** (padrão)
- **MAIÚSCULAS**
- **minúsculas**
- **Capitalizar**

---

### 3️⃣ LAYOUT

#### Bordas
- **Border Radius**: 0px a 24px (slider)
- **Presets**: Quadrado (0) | Suave (8) | Arredondado (12) | Pill (24)

#### Padding
- **Interno**: 0px a 24px
- **Separado**: Top | Right | Bottom | Left

#### Sombra
- **Intensidade**: 0 a 5
  - 0: Sem sombra
  - 1: Sutil
  - 2: Leve (padrão)
  - 3: Média
  - 4: Forte
  - 5: Dramática

#### Opacidade
- **Header**: 50% a 100%
- **Body**: 50% a 100%

---

### 4️⃣ CORES (Expandido)

#### Cor do Header
- 🎨 **Picker completo**
- **Gradiente** (toggle)
- **Opacidade** (slider)

#### Cor do Body
- 🎨 **Picker completo**
- **Gradiente** (toggle)
- **Opacidade** (slider)

#### Cor da Borda
- 🎨 **Picker completo**
- **Largura**: 0px a 4px

---

### 5️⃣ TIPO DE CONTEÚDO

#### Tipo do Node
- 📝 **Nota** (padrão)
- ✅ **Checklist**
- 📊 **Tabela**
- 🖼️ **Imagem**
- 📅 **Calendário**
- 🔗 **Link**

---

### 6️⃣ AÇÕES (Mantido)
- 📋 **Duplicar**
- 🗑️ **Deletar**
- 📤 **Exportar**
- 🔗 **Copiar Link**

---

## 🎯 Estrutura do Novo Tipo CanvasNode

```typescript
interface CanvasNode {
  // ... campos existentes ...
  
  // ÍCONE
  icon?: string;
  iconPosition?: "top-left" | "top-center" | "top-right" |
                 "center-left" | "center" | "center-right" |
                 "bottom-left" | "bottom-center" | "bottom-right";
  iconSize?: "XS" | "S" | "M" | "L" | "XL";
  iconStyle?: "normal" | "background" | "border" | "shadow";
  iconBackgroundColor?: string;
  
  // TÍTULO
  title: string;
  titleAlign?: "left" | "center" | "right";
  titleVerticalAlign?: "top" | "center" | "bottom";
  titleSize?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  titleWeight?: 100 | 300 | 400 | 500 | 600 | 700 | 900;
  titleColor?: string;
  titleTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  
  // LAYOUT
  borderRadius?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  shadowIntensity?: 0 | 1 | 2 | 3 | 4 | 5;
  headerOpacity?: number;
  bodyOpacity?: number;
  
  // CORES
  headerColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
  
  // ESTILO (mantido para presets)
  style?: NodeStyle;
}
```

---

## 🖼️ Layout do Novo Painel

```
┌─────────────────────────────────┐
│  ⚙️ Configurações do Node       │
├─────────────────────────────────┤
│                                 │
│  📌 ÍCONE                       │
│  ┌─────┬─────┬─────┐           │
│  │ ⬉   │  ⬆  │  ⬈  │  Posição │
│  ├─────┼─────┼─────┤           │
│  │ ⬅   │  ⏺  │  ➡  │           │
│  ├─────┼─────┼─────┤           │
│  │ ⬋   │  ⬇  │  ⬊  │           │
│  └─────┴─────┴─────┘           │
│                                 │
│  Tamanho  [━━━●━━━━]  24px     │
│                                 │
│  Estilo: [Normal ▼]            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  📝 TÍTULO                      │
│                                 │
│  Horizontal: [Esquerda ▼]       │
│  Vertical:   [Topo ▼]           │
│                                 │
│  Tamanho:    [━━━━●━━━] 18px   │
│  Peso:       [Semibold ▼]       │
│  Cor:        [🎨 #FFFFFF]       │
│  Transform:  [Normal ▼]         │
│                                 │
├─────────────────────────────────┤
│                                 │
│  🎨 LAYOUT                      │
│                                 │
│  Bordas:     [━━━━●━━━] 12px   │
│  Sombra:     [●━━━━━━━] 1      │
│                                 │
│  Opacidade Header: [━━━●━━] 100│
│  Opacidade Body:   [━━━●━━] 100│
│                                 │
├─────────────────────────────────┤
│                                 │
│  🎯 TIPO                        │
│  [📝 Nota ▼]                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ⚡ AÇÕES                       │
│  📋 Duplicar                    │
│  🗑️ Deletar                     │
│                                 │
└─────────────────────────────────┘
```

---

## 🚀 Implementação

### Fase 1: Ícone e Título Básico
- [x] Posição do ícone (9 posições)
- [x] Tamanho do ícone
- [x] Posição vertical do título
- [x] Peso da fonte

### Fase 2: Cores e Layout
- [ ] Cor personalizada do texto
- [ ] Border radius slider
- [ ] Sombra intensidade
- [ ] Opacidade

### Fase 3: Avançado
- [ ] Gradientes
- [ ] Padding individual
- [ ] Estilos de ícone (fundo/borda)
- [ ] Transformação de texto

---

## 🎨 Design do Painel

- **Tema**: Escuro (#1E1E1E)
- **Acento**: Azul (#0984E3)
- **Texto**: Branco/Cinza
- **Bordas**: #333333
- **Hover**: #2D3436
- **Checkmark**: Círculo azul no canto

---

Pronto para implementar? 🚀
