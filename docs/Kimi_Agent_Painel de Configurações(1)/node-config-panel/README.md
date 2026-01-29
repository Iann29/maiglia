# 📌 Painel de Configurações de Node - Maiglia

Painel de configurações **enxuto e profissional** para customização de ícones em nodes.

---

## ✨ Funcionalidades

### Configurações de ÍCONE

| Configuração | Opções | Descrição |
|--------------|--------|-----------|
| **Ícone** | Emoji selecionado / Sem ícone | Escolha ou remova o ícone |
| **Posição** | 9 posições (grid 3x3) | Topo/Centro/Base × Esquerda/Centro/Direita |
| **Tamanho** | XS (16px) / S (20px) / M (24px) / L (32px) / XL (40px) | Tamanho do emoji |
| **Estilo** | Normal / Com fundo / Com borda / Com sombra | Estilo visual do ícone |

### Ações
- 📋 **Duplicar** - Duplica o node
- 🗑️ **Deletar** - Remove o node

---

## 📁 Arquivos

```
node-config-panel/
├── types.ts              # Tipos TypeScript
├── constants.ts          # Constantes e helpers
├── NodeSettingsPanel.tsx # Componente principal
└── README.md            # Este arquivo
```

---

## 🚀 Como Integrar

### 1. Copie os arquivos

```bash
cp node-config-panel/* src/components/canvas/
```

### 2. Atualize o tipo CanvasNode

Adicione os novos campos na interface `CanvasNode`:

```typescript
// canvas-types.ts

export type IconPosition =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type IconSize = "XS" | "S" | "M" | "L" | "XL";
export type IconStyle = "normal" | "background" | "border" | "shadow";

export interface CanvasNode {
  // ... campos existentes ...
  
  // Novos campos de ícone
  iconPosition?: IconPosition;  // default: "top-center"
  iconSize?: IconSize;          // default: "M"
  iconStyle?: IconStyle;        // default: "normal"
}
```

### 3. Use o componente no seu Canvas

```tsx
import { NodeSettingsPanel } from "./NodeSettingsPanel";
import { DEFAULT_ICON_CONFIG } from "./constants";

function SeuComponente() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleConfigClick = (node: CanvasNode, position: { x: number; y: number }) => {
    setSelectedNodeId(node.id);
    setSettingsPosition(position);
    setSettingsOpen(true);
  };

  const handleConfigChange = (changes: Partial<NodeIconConfig>) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, changes);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <>
      {/* Seus nodes... */}
      
      <NodeSettingsPanel
        isOpen={settingsOpen}
        position={settingsPosition}
        nodeId={selectedNodeId || ""}
        config={{
          icon: selectedNode?.icon,
          iconPosition: selectedNode?.iconPosition ?? DEFAULT_ICON_CONFIG.iconPosition,
          iconSize: selectedNode?.iconSize ?? DEFAULT_ICON_CONFIG.iconSize,
          iconStyle: selectedNode?.iconStyle ?? DEFAULT_ICON_CONFIG.iconStyle,
        }}
        onClose={() => setSettingsOpen(false)}
        onConfigChange={handleConfigChange}
        onIconClick={() => {
          // Abre seu emoji picker
          setEmojiPickerOpen(true);
        }}
        onRemoveIcon={() => {
          if (selectedNodeId) {
            updateNode(selectedNodeId, { icon: undefined });
          }
        }}
        onDuplicate={() => {
          if (selectedNodeId) {
            duplicateNode(selectedNodeId);
          }
        }}
        onDelete={() => {
          if (selectedNodeId) {
            deleteNode(selectedNodeId);
          }
        }}
      />
    </>
  );
}
```

### 4. Renderize o ícone no NodeHeader

```tsx
// NodeHeader.tsx
import { getIconSizeInPixels, getIconStyleCSS, ICON_POSITION_STYLES } from "./constants";

function NodeHeader({ node }: { node: CanvasNode }) {
  const iconSize = getIconSizeInPixels(node.iconSize ?? "M");
  const iconStyle = getIconStyleCSS(node.iconStyle ?? "normal");
  const positionStyle = ICON_POSITION_STYLES[node.iconPosition ?? "top-center"];

  return (
    <div style={{ position: "relative" }}>
      {/* Ícone posicionado absolutamente */}
      {node.icon && (
        <span
          style={{
            ...positionStyle,
            ...iconStyle,
            fontSize: iconSize,
          }}
        >
          {node.icon}
        </span>
      )}
      
      {/* Resto do header... */}
    </div>
  );
}
```

---

## 🎨 Design

- **Tema**: Escuro (#1E1E1E)
- **Cor de destaque**: Azul (#0984E3)
- **Checkmark**: Círculo azul no canto superior direito dos itens selecionados
- **Hover**: Borda e texto ficam mais claros
- **Transições**: 150ms para feedback suave

---

## 📋 Valores Padrão

```typescript
const DEFAULT_ICON_CONFIG = {
  iconPosition: "top-center",
  iconSize: "M",
  iconStyle: "normal",
};
```

---

## 🔧 Helpers Disponíveis

### `getIconSizeInPixels(size: IconSize): number`
Converte tamanho (XS/S/M/L/XL) para pixels.

### `getIconStyleCSS(style: IconStyle, baseColor?: string): CSSProperties`
Retorna estilos CSS baseados no estilo selecionado.

### `ICON_POSITION_STYLES: Record<IconPosition, CSSProperties>`
Mapeamento de posições para estilos CSS absolutos.

---

## ✅ Checklist de Integração

- [ ] Copiar arquivos para `src/components/canvas/`
- [ ] Adicionar tipos no `canvas-types.ts`
- [ ] Adicionar campos no Convex (se persistir no banco)
- [ ] Importar e usar `NodeSettingsPanel` no componente pai
- [ ] Atualizar `NodeHeader` para renderizar ícone na posição correta
- [ ] Testar todas as 9 posições
- [ ] Testar todos os 5 tamanhos
- [ ] Testar todos os 4 estilos

---

Pronto para usar! 🚀
