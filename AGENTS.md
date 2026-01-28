# MAIGLIA - Documentação do Projeto

## Sobre o Projeto

Maiglia é um SaaS de produtividade pessoal que oferece planilhas pré-construídas organizadas em blocos dentro de um canvas interativo. Os usuários podem arrastar, redimensionar e editar blocos de planilhas para criar seu próprio sistema de organização — seja para finanças, hábitos, metas, projetos ou rotina.

**Foco**: Eliminar a fricção de criar planilhas do zero, entregando templates prontos que funcionam de forma visual e integrada.

---

## Arquitetura do Projeto

### Stack Tecnológica
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Convex (BaaS com real-time sync)
- **Autenticação**: Better Auth
- **Estilização**: Tailwind CSS
- **Canvas**: react-rnd (drag & resize)

### Estrutura de Pastas

```
maiglia/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rotas de autenticação (login, cadastro)
│   │   ├── (dashboard)/        # Rotas autenticadas (dashboard, temas, minha-conta)
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── canvas/             # Componentes do canvas (InfiniteCanvas, CanvasNode)
│   │   ├── layout/             # Componentes de layout (DashboardHeader, WorkspaceTabs)
│   │   ├── providers/          # Context providers (ThemeProvider, ConvexClientProvider)
│   │   └── ui/                 # Componentes genéricos de UI (Loading, CreditBalance, etc.)
│   ├── constants/              # Constantes centralizadas
│   │   └── canvas.ts           # Constantes do canvas (GRID_SIZE, NODE_COLORS, etc.)
│   ├── hooks/                  # Custom hooks (useNodes, useWorkspaces, useActiveTheme)
│   └── lib/                    # Utilitários e configurações
├── convex/
│   ├── lib/                    # Utilitários do backend
│   │   └── constants.ts        # Constantes do backend (duplicadas do frontend)
│   ├── nodes/                  # Mutations e queries de nodes
│   ├── themes/                 # Mutations e queries de temas
│   ├── credits/                # Sistema de créditos e gamificação
│   ├── workspaces/             # Mutations e queries de workspaces
│   └── users/                  # Queries de usuários
```

---

## Regras de Código

### 1. Constantes Centralizadas

**SEMPRE** use constantes dos arquivos centralizados. **NUNCA** defina constantes duplicadas em arquivos locais.

```typescript
// ✅ CORRETO - Frontend
import { GRID_SIZE, NODE_COLORS, getRandomNodeColor } from "@/constants/canvas";

// ✅ CORRETO - Backend (Convex)
import { GRID_SIZE, NODE_COLORS, getRandomNodeColor } from "../lib/constants";

// ❌ ERRADO - Definir localmente
const GRID_SIZE = 40; // NÃO FAÇA ISSO!
```

**Por que duplicamos entre frontend e backend?**
Convex roda em um ambiente isolado e não pode importar de `src/`. Por isso, mantemos `convex/lib/constants.ts` sincronizado com `src/constants/canvas.ts`.

---

### 2. Organização de Componentes

| Tipo | Pasta | Exemplo |
|------|-------|---------|
| Componentes genéricos de UI | `src/components/ui/` | Loading, CreditBalance, ThemeToggle |
| Context Providers | `src/components/providers/` | ThemeProvider, ConvexClientProvider |
| Componentes do Canvas | `src/components/canvas/` | InfiniteCanvas, CanvasNode |
| Componentes de Layout | `src/components/layout/` | DashboardHeader, WorkspaceTabs |

---

### 3. Performance do Canvas

#### React.memo para Nodes
Todos os componentes que renderizam listas de nodes **DEVEM** usar `React.memo` com comparador personalizado:

```typescript
// ✅ CORRETO
function arePropsEqual(prev: NodeProps, next: NodeProps): boolean {
  return prev.node.id === next.node.id &&
         prev.node.x === next.node.x &&
         prev.node.y === next.node.y &&
         // ... comparar todas as props que afetam render
         prev.isSelected === next.isSelected;
}

export const CanvasNode = memo(CanvasNodeComponent, arePropsEqual);
```

#### Isolamento de Estado Durante Drag
Para evitar flicker durante drag, use estado local para isolar a posição visual do Convex:

```typescript
// ✅ CORRETO - Estado local durante drag
const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

// Posição visual = dragPosition (se arrastando) ou posição do Convex
const rndPosition = dragPosition ?? { x: node.x, y: node.y };
```

#### Optimistic Updates
**SEMPRE** use optimistic updates para operações que afetam a UI imediatamente:

```typescript
// ✅ CORRETO - Optimistic update
const mutation = useMutation(api.nodes.mutations.update).withOptimisticUpdate(
  (localStore, args) => {
    // Atualiza o cache local imediatamente
    const nodes = localStore.getQuery(api.nodes.queries.list, { workspaceId });
    if (!nodes) return;
    localStore.setQuery(
      api.nodes.queries.list,
      { workspaceId },
      nodes.map(n => n._id === args.nodeId ? { ...n, ...args } : n)
    );
  }
);
```

---

### 4. Convex (Backend)

#### Estrutura Feature-Based
Cada feature tem sua própria pasta com `mutations.ts` e `queries.ts`:

```
convex/
├── nodes/
│   ├── mutations.ts    # create, update, remove, updateMany, removeMany
│   └── queries.ts      # listByWorkspace
├── themes/
│   ├── mutations.ts    # populate, unlock
│   └── queries.ts      # list, getActive
```

#### Validação com Zod
**SEMPRE** use `v.object()` para validar argumentos:

```typescript
// ✅ CORRETO
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    x: v.number(),
    y: v.number(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => { ... }
});
```

---

### 5. Hooks Personalizados

#### Padrão de Nomenclatura
- `use[Entity]s` para hooks que gerenciam uma entidade (ex: `useNodes`, `useWorkspaces`)
- `use[Action]` para hooks que executam uma ação específica (ex: `useActiveTheme`)

#### Regras de Hooks React
```typescript
// ❌ ERRADO - Acessar ref durante render
useMemo(() => {
  if (!hasCreated.current) { // NÃO! refs não devem ser lidas em useMemo
    createSomething();
  }
}, []);

// ✅ CORRETO - Usar useEffect para side effects
useEffect(() => {
  if (!hasCreated.current) {
    hasCreated.current = true;
    createSomething();
  }
}, []);
```

---

### 6. Imports

#### Usar Aliases
**SEMPRE** use o alias `@/` para imports do `src/`:

```typescript
// ✅ CORRETO
import { Loading } from "@/components/ui/Loading";
import { GRID_SIZE } from "@/constants/canvas";

// ❌ ERRADO
import { Loading } from "../../components/ui/Loading";
```

#### Ordem de Imports
1. React e bibliotecas externas
2. Componentes do projeto (`@/components/`)
3. Hooks (`@/hooks/`)
4. Utilitários e constantes (`@/lib/`, `@/constants/`)
5. Tipos

---

### 7. TypeScript

#### Nunca Usar `any`
```typescript
// ❌ ERRADO
const data: any = fetchData();

// ✅ CORRETO
interface NodeData {
  id: string;
  x: number;
  y: number;
}
const data: NodeData = fetchData();
```

#### Tipos Explícitos para Props
```typescript
// ✅ CORRETO
interface CanvasNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function CanvasNode({ node, isSelected, onSelect }: CanvasNodeProps) { ... }
```

---

### 8. Commits

Siga o padrão Conventional Commits:

```
feat: adiciona nova funcionalidade
fix: corrige bug
refactor: refatora código sem mudar comportamento
perf: melhoria de performance
chore: tarefas de manutenção
docs: documentação
```

**Exemplos:**
- `feat: adiciona sistema de créditos`
- `fix: corrige flicker ao mover nodes`
- `refactor: centraliza constantes em src/constants/canvas.ts`
- `perf: adiciona React.memo ao CanvasNode`

---

## Decisões de Arquitetura

### Por que Convex?
- Real-time sync out of the box
- Optimistic updates fáceis de implementar
- TypeScript end-to-end
- Não precisa de servidor separado

### Por que react-rnd para o Canvas?
- Suporte nativo a drag & resize
- Snap to grid integrado
- Performance otimizada
- Bounds configuráveis

### Por que Better Auth?
- Integração nativa com Convex
- Suporte a múltiplos providers
- Gestão de sessão simplificada

---

## Ferramentas Úteis

### filtree - Visualizar Estrutura de Arquivos

```bash
filtree -h                      # Ajuda
filtree                          # Diretório atual
filtree src/                     # Diretório específico
filtree -d                       # Apenas pastas
filtree --content 10             # Inclui primeiras 10 linhas
filtree -cs                      # Copia e salva arquivo
filtree --depth 2                # Limita a 2 níveis
```

---

## Changelog

### v0.1.0 - Sistema de Temas Premium
- US-003: Queries e Mutations de Temas
- US-004: Seed dos 6 Temas Iniciais
- US-005: Aplicação Dinâmica de Temas
- US-006: Componente de Exibição de Saldo
- US-007: Página de Galeria de Temas
- US-008: Modal de Preview e Desbloqueio
- US-009: Sistema de Gamificação - Ganhar Créditos
- US-010: Notificação Toast de Créditos Ganhos
- US-011: Página de Histórico de Créditos
- US-012: Migração de Usuários Existentes

### Otimizações de Performance
- React.memo no CanvasNode com comparador personalizado
- Isolamento de estado local durante drag (evita flicker)
- Optimistic updates para todas as propriedades de nodes
- Debounce reduzido de 300ms para 50ms

### Refatorações
- Constantes centralizadas em `src/constants/canvas.ts` e `convex/lib/constants.ts`
- Componentes reorganizados em `ui/`, `providers/`, `canvas/`, `layout/`
- Removido código morto (`generateNodeId()`, imports não utilizados)
- Corrigido React hooks purity (useMemo → useEffect)
