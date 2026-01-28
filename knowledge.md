# 📘 MAIGLIA — Knowledge Base Completa

> Última atualização: Julho 2025
> Branch atual: `ralph/temas-premium`

---

## 📌 Visão Geral do Projeto

**Maiglia** é um SaaS de produtividade pessoal que oferece planilhas pré-construídas organizadas em blocos dentro de um **canvas interativo infinito**. Os usuários podem arrastar, redimensionar e editar blocos de planilhas para criar seu próprio sistema de organização — seja para finanças, hábitos, metas, projetos ou rotina.

**Foco:** Eliminar a fricção de criar planilhas do zero, entregando templates prontos que funcionam de forma visual e integrada.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| **Frontend** | Next.js (App Router) | 16.1.1 |
| **UI Framework** | React | ^19.2.1 |
| **Styling** | Tailwind CSS v4 | ^4.1.17 |
| **Animações** | Framer Motion | ^12.24.7 |
| **Estado local** | Zustand | ^5.0.9 |
| **Drag & Resize** | react-rnd | ^10.5.2 |
| **Backend/DB** | Convex | ^1.31.2 |
| **Autenticação** | Better Auth + Convex Plugin | 1.4.9 / ^0.10.9 |
| **Ordenação** | fractional-indexing | ^3.2.0 |
| **Rate Limiting** | @convex-dev/rate-limiter | latest |
| **Migrações** | @convex-dev/migrations | latest |
| **Agregados** | @convex-dev/aggregate | latest |
| **Linguagem** | TypeScript | ^5.9.3 |
| **Linting** | ESLint + Convex Plugin | ^9.39.1 |
| **Formatação** | Prettier | ^3.6.2 |
| **Build** | Turbopack (Next.js dev) | — |
| **Package Manager** | npm | — |

---

## 📂 Estrutura de Diretórios

```
maiglia/
├── convex/                      # Backend (Convex)
│   ├── _generated/              # Código gerado pelo Convex
│   ├── betterAuth/              # Componente Better Auth
│   │   ├── _generated/          # Gerado pelo componente auth
│   │   ├── adapter.ts           # Adapter Convex ↔ Better Auth
│   │   ├── auth.ts              # Config auth do componente
│   │   ├── convex.config.ts     # Config do componente
│   │   ├── generatedSchema.ts   # Schema gerado
│   │   └── schema.ts            # Schema de auth (user, session, account)
│   ├── credits/                 # Sistema de créditos
│   │   ├── gamification.ts      # Lógica de gamificação (addCredits, limites diários)
│   │   ├── migrate.ts           # Migração de usuários existentes
│   │   ├── mutations.ts         # add, spend, addInternal
│   │   └── queries.ts           # get (saldo), getTransactions
│   ├── nodes/                   # Blocos do canvas
│   │   ├── migrate.ts           # Migração: backfill nodeCount em workspaces existentes
│   │   ├── mutations.ts         # create, update, reorder, duplicate, remove (atualiza nodeCount)
│   │   └── queries.ts           # listByWorkspace, get, countByWorkspace (O(1) via nodeCount)
│   ├── preferences/             # Preferências do usuário
│   │   ├── mutations.ts         # updateTheme
│   │   └── queries.ts           # get
│   ├── themes/                  # Sistema de temas
│   │   ├── mutations.ts         # seedThemes, unlock, setActive
│   │   └── queries.ts           # list, getActive
│   ├── users/
│   │   └── queries.ts           # Queries de usuários
│   ├── workspaces/              # Workspaces (abas)
│   │   ├── mutations.ts         # create, update, reorder, remove
│   │   └── queries.ts           # list, get, getFirst
│   ├── auth.config.ts           # Config de providers (Better Auth)
│   ├── auth.ts                  # Setup do Better Auth (createAuth, createAuthOptions)
│   ├── convex.config.ts         # defineApp + betterAuth component
│   ├── http.ts                  # HTTP router (auth routes)
│   └── schema.ts                # Schema principal do banco de dados
│
├── src/                         # Frontend (Next.js)
│   ├── app/                     # App Router (pages + layouts)
│   │   ├── (auth)/              # Grupo de rotas de autenticação
│   │   │   ├── cadastro/page.tsx    # Página de cadastro
│   │   │   ├── login/page.tsx       # Página de login
│   │   │   └── layout.tsx           # Layout centralizado com logo
│   │   ├── (dashboard)/         # Grupo de rotas do dashboard
│   │   │   ├── dashboard/page.tsx   # Canvas infinito
│   │   │   ├── minha-conta/page.tsx # Conta + créditos + histórico
│   │   │   ├── temas/page.tsx       # Galeria de temas
│   │   │   └── layout.tsx           # Layout com header + tabs + auth guard
│   │   ├── api/auth/[...all]/route.ts  # Catch-all API auth
│   │   ├── globals.css          # CSS global (design tokens, theme system)
│   │   ├── layout.tsx           # Root layout (providers, fonts, metadata)
│   │   └── page.tsx             # Landing page
│   │
│   ├── components/              # Componentes React
│   │   ├── canvas/              # Componentes do canvas infinito
│   │   │   ├── canvas-types.ts      # Tipos, constantes, helpers do canvas
│   │   │   ├── CanvasNode.tsx       # Node individual (drag, resize, select)
│   │   │   ├── ContextMenu.tsx      # Menu de contexto (layers, cor, deletar)
│   │   │   ├── InfiniteCanvas.tsx   # Canvas principal com grid
│   │   │   ├── NodeContent.tsx      # Área de conteúdo do node
│   │   │   ├── NodeHeader.tsx       # Header colorido com título editável
│   │   │   └── useCanvasStore.ts    # Zustand store do canvas
│   │   ├── layout/              # Componentes de layout
│   │   │   ├── DashboardHeader.tsx  # Header fixo (logo, add node, conta)
│   │   │   └── WorkspaceTabs.tsx    # Abas de workspaces
│   │   ├── ConvexClientProvider.tsx # Provider principal (Convex + Auth + Theme)
│   │   ├── CreditBalance.tsx    # Exibição de saldo de créditos
│   │   ├── CreditToast.tsx      # Toast de créditos ganhos
│   │   ├── Loading.tsx          # Tela de loading animada (logo + folha)
│   │   ├── ThemePreviewModal.tsx # Modal de preview e desbloqueio de tema
│   │   ├── ThemeProvider.tsx    # Provider de tema premium
│   │   └── ThemeToggle.tsx      # Toggle light/dark/system
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useActiveTheme.ts    # Hook para tema premium ativo
│   │   ├── useNodes.ts          # Sincronização nodes Convex ↔ Zustand
│   │   └── useWorkspaces.ts     # CRUD + estado de workspaces
│   │
│   └── lib/                     # Utilitários e configuração
│       ├── auth-client.ts       # Better Auth client (signIn, signUp, etc.)
│       ├── auth-server.ts       # Better Auth server (handler, preloadAuthQuery)
│       ├── premiumTheme.ts      # Aplicação dinâmica de CSS variables
│       └── theme.ts             # Sistema light/dark/system
│
├── scripts/ralph/               # Scripts do assistente Ralph (automação)
├── AGENTS.md                    # Instruções para AI agents
├── package.json                 # Dependências e scripts
├── next.config.ts               # Config Next.js
├── tsconfig.json                # Config TypeScript
├── postcss.config.mjs           # PostCSS (Tailwind)
├── eslint.config.mjs            # ESLint config
└── .prettierrc                  # Prettier config (vazio = defaults)
```

---

## 🗄️ Schema do Banco de Dados (Convex)

### Tabelas Principais (`convex/schema.ts`)

#### `userPreferences`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | ID do usuário (Better Auth) |
| `theme` | `"light" \| "dark" \| "system"` | Tema light/dark do usuário |
| `activeThemeId` | `Id<"themes">?` | Tema premium ativo (opcional) |
| `updatedAt` | `number` | Timestamp da última atualização |
| **Index:** `by_userId` | `[userId]` | |

#### `credits`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | ID do usuário |
| `balance` | `number` | Saldo atual de créditos |
| `updatedAt` | `number` | Timestamp da última atualização |
| **Index:** `by_userId` | `[userId]` | |

#### `creditTransactions`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | ID do usuário |
| `amount` | `number` | Positivo = ganho, negativo = gasto |
| `type` | `"earned" \| "spent" \| "purchased"` | Tipo da transação |
| `reason` | `string` | Descrição (ex: "Criação de bloco") |
| `createdAt` | `number` | Timestamp |
| **Index:** `by_userId` | `[userId]` | |
| **Index:** `by_userId_createdAt` | `[userId, createdAt]` | Range query por data |

#### `themes`
| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Nome do tema |
| `slug` | `string` | Slug único |
| `description` | `string` | Descrição |
| `previewUrl` | `string?` | URL de preview (opcional) |
| `colors` | `object` | `{ bgPrimary, bgSecondary, fgPrimary, fgSecondary, accent, accentHover }` |
| `font` | `string` | Fonte do tema |
| `isDefault` | `boolean` | Se é tema gratuito padrão |
| `price` | `number` | Preço em créditos (0 = grátis) |
| `createdAt` | `number` | Timestamp |
| **Index:** `by_slug` | `[slug]` | |
| **Index:** `by_isDefault` | `[isDefault]` | Busca temas default |

#### `userThemes`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | ID do usuário |
| `themeId` | `Id<"themes">` | Referência ao tema |
| `unlockedAt` | `number` | Timestamp do desbloqueio |
| **Index:** `by_userId` | `[userId]` | |
| **Index:** `by_userId_themeId` | `[userId, themeId]` | |

#### `workspaces`
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | `string` | ID do usuário |
| `name` | `string` | Nome do workspace |
| `color` | `string` | Cor hex do workspace |
| `index` | `string` | Fractional index para ordenação |
| `nodeCount` | `number?` | Contador pré-calculado de nodes (opcional para backward compat) |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |
| **Index:** `by_userId` | `[userId]` | |
| **Index:** `by_userId_index` | `[userId, index]` | |

#### `nodes`
| Campo | Tipo | Descrição |
|---|---|---|
| `workspaceId` | `Id<"workspaces">` | Referência ao workspace |
| `type` | `"note" \| "table" \| "checklist"` | Tipo do bloco |
| `x` | `number` | Posição X no canvas |
| `y` | `number` | Posição Y no canvas |
| `width` | `number` | Largura em pixels |
| `height` | `number` | Altura em pixels |
| `color` | `string` | Cor hex do header |
| `index` | `string` | Fractional index para z-order |
| `title` | `string` | Título do bloco |
| `titleAlign` | `"left" \| "center" \| "right"` | Alinhamento do título |
| `content` | `any?` | Conteúdo do bloco (flexível) |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |
| **Index:** `by_workspaceId` | `[workspaceId]` | |
| **Index:** `by_workspaceId_index` | `[workspaceId, index]` | |

### Tabelas de Auth (Better Auth - componente separado)
Gerenciadas automaticamente: `user`, `session`, `account`, `verification`.

---

## 🔐 Sistema de Autenticação

### Stack
- **Better Auth** como framework de autenticação
- **@convex-dev/better-auth** como adapter para Convex
- Plugin `admin` para roles de usuário
- Plugin `convex` para integração JWT

### Sistema Dual de Auth (`convex/lib/auth.ts`)

| Função | Tipo | Latência | Uso |
|---|---|---|---|
| `getOptionalUserFast(ctx)` | Fast (JWT) | ~0ms | **QUERIES** - retorna `FastUser \| null` |
| `requireAuthFast(ctx)` | Fast (JWT) | ~0ms | **QUERIES** - throws se não autenticado |
| `getOptionalUser(ctx)` | Full (DB) | ~800ms | **MUTATIONS** - retorna `User \| null` |
| `requireAuth(ctx)` | Full (DB) | ~800ms | **MUTATIONS** - throws se não autenticado |

**Regra de ouro:** Queries → Fast (JWT), Mutations → Full (DB)

**FastUser interface:**
```typescript
interface FastUser {
  _id: string;           // identity.subject
  name: string | undefined;
  email: string | undefined;
  emailVerified: boolean;
  sessionId: string | undefined;
}
```

**Motivo:** `ctx.auth.getUserIdentity()` lê o JWT (~0ms), enquanto `authComponent.getAuthUser(ctx)` faz query no banco (~800ms). Em dashboards com 5-6 queries simultâneas, isso economiza ~4-5 segundos de carregamento.

### Fluxo
1. **Frontend** (`auth-client.ts`): `createAuthClient` com plugins `convexClient()` e `adminClient()`
2. **API Route** (`/api/auth/[...all]`): Catch-all route delegando para `convexBetterAuthNextJs`
3. **Backend** (`auth.ts`): `createAuth` com configuração de providers, trusted origins, email+password
4. **HTTP** (`http.ts`): `authComponent.registerRoutes` para endpoints de auth

### Funcionalidades
- Cadastro com email + senha (sem verificação de email)
- Login com email + senha
- Roles: `user` e `admin`
- JWT tokens via Convex
- Trusted origins: localhost:3000, dev.maiglia.com:3000, maiglia.com

---

## 🎨 Sistema de Temas

### Arquitetura em 3 camadas

#### 1. Tema Base (Light/Dark/System)
- **Arquivo:** `src/lib/theme.ts`
- Gerenciado via `localStorage` (`maiglia-theme`) e CSS classes (`html.light` / `html.dark`)
- Script inline no `<head>` evita flash (FOUC)
- Sincronizado com Convex via `userPreferences`

#### 2. Design Tokens (CSS Variables)
- **Arquivo:** `src/app/globals.css`
- Sistema completo de variáveis: backgrounds, foregrounds, borders, accent, semantic, canvas
- Integrado com Tailwind v4 via `@theme inline`
- Classes utilitárias: `bg-bg-primary`, `text-fg-primary`, `border-border-primary`, etc.

#### 3. Temas Premium
- **Arquivo:** `src/lib/premiumTheme.ts`
- Sobrescreve CSS variables dinamicamente via JavaScript
- Aplica cores + fonte customizada
- `applyPremiumTheme()` / `clearPremiumTheme()`
- Provider (`ThemeProvider.tsx`) monitora tema ativo via Convex e aplica/remove

### 6 Temas Iniciais (Seed)
| Tema | Tipo | Preço | Fonte |
|---|---|---|---|
| Default Light | Default (grátis) | 0 | Geist Sans |
| Default Dark | Default (grátis) | 0 | Geist Sans |
| Ocean | Premium | 50 | Outfit |
| Forest | Premium | 50 | Nunito |
| Sunset | Premium | 75 | Quicksand |
| Midnight | Premium | 75 | Poppins |

---

## 💰 Sistema de Créditos e Gamificação

### Economia
- **Saldo inicial:** 50 créditos (bônus de boas-vindas / migração)
- **Moeda:** Créditos (inteiros, nunca fracionários)

### Formas de Ganhar
| Ação | Créditos | Limite |
|---|---|---|
| Primeiro workspace criado | +5 | Único |
| Criação de bloco (node) | +2 | 10/dia (categoria `node_creation`) |
| Bônus de boas-vindas (migração) | +50 | Único |

### Formas de Gastar
| Ação | Créditos |
|---|---|
| Desbloquear tema Ocean/Forest | 50 |
| Desbloquear tema Sunset/Midnight | 75 |

### Limites Diários
- Sistema de `addCreditsWithDailyLimit` verifica transações do dia (UTC) por categoria
- Se ultrapassar o limite, credita apenas o restante ou retorna `false`

### Componentes de UI
- **CreditBalance** (`DashboardHeader`): Mostra saldo com ícone de moeda
- **CreditToast**: Toast verde animado `+X créditos!` quando saldo aumenta
- **Histórico**: Lista de transações na página "Minha Conta"

---

## 🖼️ Canvas Infinito

### Arquitetura

```
InfiniteCanvas (container com grid)
├── CanvasNode[] (blocos individuais via react-rnd)
│   ├── NodeHeader (título editável + cor + config button)
│   └── NodeContent (área de conteúdo - placeholder atual)
├── ContextMenu (menu flutuante com submenus)
└── Node Counter (badge fixo bottom-right)
```

### Constantes do Canvas
| Constante | Valor | Descrição |
|---|---|---|
| `GRID_SIZE` | 40px | Tamanho do grid (snap) |
| `CANVAS_PADDING` | 40px | Padding interno |
| `CANVAS_SIDE_BORDER` | 60px | Bordas laterais |
| `MIN_NODE_WIDTH` | 160px (4 grid) | Largura mínima |
| `MIN_NODE_HEIGHT` | 80px (2 grid) | Altura mínima |
| `DEFAULT_NODE_WIDTH` | 160px (4 grid) | Largura padrão |
| `DEFAULT_NODE_HEIGHT` | 120px (3 grid) | Altura padrão |
| `NODE_HEADER_HEIGHT` | 40px (1 grid) | Altura do header |
| `NODE_BORDER_RADIUS` | 8px | Border radius |

### Funcionalidades dos Nodes
- **Drag & Drop** com snap to grid (40px)
- **Resize** com snap to grid, handles nas bordas e cantos
- **Seleção** com borda accent e shadow
- **Título editável** (clique para editar, Enter para salvar, Escape para cancelar)
- **Menu de configuração** (hover/seleção): Mudar cor, Duplicar, Camadas (z-order), Deletar
- **Z-ordering** via fractional indexing (frente, trás, subir, descer)
- **Cores:** 8 cores pré-definidas (red, orange, yellow, green, cyan, blue, purple, pink)
- **Keyboard shortcuts:** Delete/Backspace para deletar, Escape para desselecionar
- **Badge de resize:** Mostra dimensões em grid durante resize (ex: `4×3`)

### Tipos de Node (definidos, não implementados no conteúdo)
- `note` — Notas/texto
- `table` — Planilha/tabela
- `checklist` — Lista de tarefas

### Sincronização Convex ↔ Zustand
O hook `useNodes` implementa uma estratégia de sincronização:
1. **Convex → Zustand:** `useQuery` busca nodes, `useEffect` popula o store
2. **Zustand → UI:** Componentes leem do Zustand para responsividade imediata
3. **Zustand → Convex:** Mutations com **debounce de 500ms** para saves
4. **Otimistic updates:** Atualização local imediata antes da confirmação do servidor

---

## 📑 Workspaces (Abas)

### Funcionalidades
- **Múltiplos workspaces** por usuário (como abas de browser)
- **Criação automática** do primeiro workspace ("Meu Workspace") se não existir
- **CRUD completo:** Criar, renomear, mudar cor, deletar
- **Reordenação** via fractional indexing
- **Menu de contexto:** Botão direito → Renomear, Mudar cor (8 opções), Deletar
- **Duplo clique** para renomear inline
- **Proteção:** Não permite deletar o último workspace
- **Gamificação:** +5 créditos ao criar o primeiro workspace

### 8 Cores Disponíveis
`blue (#3b82f6)`, `green (#22c55e)`, `orange (#f97316)`, `purple (#8b5cf6)`, `pink (#ec4899)`, `cyan (#06b6d4)`, `yellow (#eab308)`, `red (#ef4444)`

---

## 📄 Páginas da Aplicação

### `/` — Landing Page
- Verifica sessão: se logado, redireciona para `/dashboard`
- Se não logado: mostra logo + botões "Entrar" e "Cadastrar"

### `/login` — Login
- Formulário: email + senha
- Validação de erro inline
- Redireciona para `/dashboard` após login
- Seta `sessionStorage["maiglia-just-logged-in"]` para evitar flash de loading

### `/cadastro` — Cadastro
- Formulário: nome, email, senha, confirmar senha
- Validação: senhas coincidem, mínimo 8 caracteres
- Redireciona para `/dashboard` após cadastro

### `/dashboard` — Canvas Interativo
- Canvas infinito com grid pontilhado
- Header fixo: logo, botão "Adicionar Bloco", saldo de créditos, ícone de conta
- Workspace tabs: abas de workspaces abaixo do header
- Área do canvas: nodes arrastaveis e redimensionáveis
- Counter de nodes no canto inferior direito

### `/minha-conta` — Minha Conta
- Informações do usuário (nome, email, role)
- Badge de role (admin vs user)
- Preferências: toggle light/dark/system + link para galeria de temas
- Seção de créditos: saldo + histórico completo de transações
- Botão de logout

### `/temas` — Galeria de Temas
- Grid 3 colunas de cards de temas
- Preview visual com cores do tema
- Badges: Ativo, Gratuito, X créditos, Bloqueado
- Modal de preview com simulação de interface
- Ações: Desbloquear (gasta créditos), Ativar, Fechar
- Empty state com botão "Carregar Temas Iniciais" (seed)

---

## 🔄 Fluxo de Dados

### Provider Tree
```
<html>
  <body>
    <ConvexBetterAuthProvider>     # Convex + Auth
      <ThemeProvider>               # Tema premium dinâmico
        <CreditToast />             # Toast global de créditos
        {children}                  # App routes
      </ThemeProvider>
    </ConvexBetterAuthProvider>
  </body>
</html>
```

### Estado Global
| Store | Ferramenta | Escopo |
|---|---|---|
| Auth/Session | Better Auth (React hooks) | Sessão do usuário |
| Nodes do canvas | Zustand (`useCanvasStore`) | Estado local do canvas |
| Workspaces | Convex queries + `useState` | Workspaces + ativo |
| Créditos | Convex queries | Saldo + transações |
| Temas | Convex queries + CSS variables | Tema ativo |
| Preferências | Convex queries + localStorage | light/dark/system |

---

## 🧩 Padrões e Convenções

### Nomenclatura
- **Arquivos:** `camelCase.ts` para utils, `PascalCase.tsx` para componentes
- **Pastas:** `kebab-case` ou `camelCase`
- **Variáveis CSS:** `--bg-primary`, `--fg-secondary`, `--accent`, etc.
- **Tailwind classes:** `bg-bg-primary`, `text-fg-primary`, `border-border-primary`
- **Convex API:** `api.{module}.{type}.{name}` (ex: `api.credits.queries.get`)

### Padrões de Código
- **Mutations protegidas:** `authComponent.getAuthUser(ctx)` no início
- **Queries resilientes:** `try/catch` no `getAuthUser` retornando fallback
- **Indexes Convex:** Sempre usar `withIndex` para queries eficientes
- **Fractional indexing:** `generateKeyBetween` para ordenação de workspaces e z-order
- **Debounce:** 500ms para salvar posição/tamanho de nodes
- **Optimistic updates:** Atualiza Zustand imediatamente, Convex em background
- **Idempotência:** Migrations verificam existência antes de criar

### CSS
- **Design tokens** via CSS variables
- **Tailwind v4** com `@theme inline` para mapear tokens
- **Transições suaves** ao trocar tema (0.3s ease para backgrounds, 0.15s para interações)
- **Resize handles** com CSS customizado (opacity transitions, hit areas expandidas)

---

## 🚀 Scripts NPM

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `npm-run-all --parallel dev:frontend dev:backend` | Dev com frontend + backend |
| `dev:frontend` | `next dev --turbopack` | Next.js com Turbopack |
| `dev:backend` | `convex dev` | Convex dev server |
| `dev:https` | HTTPS com certificado local | Dev em `dev.maiglia.com` |
| `predev` | `convex dev --until-success && convex dashboard` | Setup inicial + abre dashboard |
| `build` | `next build` | Build de produção |
| `start` | `next start` | Serve build de produção |
| `lint` | `eslint . --ignore-pattern "convex/_generated/**"` | Linting |

---

## 🔧 Variáveis de Ambiente Necessárias

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | URL do deployment Convex |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | URL do site Convex (HTTP routes) |
| `SITE_URL` | URL do site (para Better Auth) |

---

## ✅ Features Implementadas (por User Story)

| US | Feature | Status |
|---|---|---|
| US-003 | Queries e Mutations de Temas | ✅ |
| US-004 | Seed dos 6 Temas Iniciais | ✅ |
| US-005 | Aplicação Dinâmica de Temas | ✅ |
| US-006 | Componente de Exibição de Saldo | ✅ |
| US-007 | Página de Galeria de Temas | ✅ |
| US-008 | Modal de Preview e Desbloqueio | ✅ |
| US-009 | Sistema de Gamificação | ✅ |
| US-010 | Notificação Toast de Créditos | ✅ |
| US-011 | Página de Histórico de Créditos | ✅ |
| US-012 | Migração de Usuários Existentes | ✅ |

---

## 🔮 O Que Ainda Não Está Implementado

- **Conteúdo dos Nodes:** `NodeContent.tsx` é um placeholder — não há editor de notas, tabela ou checklist
- **Tipos de Node diferenciados:** Embora `type` exista no schema (`note`, `table`, `checklist`), o conteúdo é o mesmo para todos
- **Templates pré-construídos:** O core do produto (planilhas prontas) ainda não existe
- **Busca/filtro de nodes ou workspaces**
- **Colaboração em tempo real** (multi-user)
- **Sistema de pagamento** (compra de créditos com dinheiro real)
- **Verificação de email** (desabilitada no Better Auth)
- **Upload de arquivos/imagens**
- **Export/import de dados**
- **Responsividade mobile** (canvas não é otimizado para touch)
- **PWA / Offline support**
- **Testes automatizados** (nenhum test file encontrado)
- **CI/CD pipeline**
- **Fontes Google dinâmicas** para temas premium (fontes como Outfit, Nunito, Quicksand, Poppins são referenciadas nos temas mas não carregadas via `next/font`)

---

## 📐 Decisões Arquiteturais

1. **Convex como backend:** Escolhido pela reatividade automática (queries em tempo real), serverless, e schema tipado
2. **Better Auth ao invés de Clerk/Auth0:** Mais controle, open-source, integração nativa com Convex
3. **Zustand para canvas state:** Performance crítica — Convex queries não são rápidas o suficiente para drag/resize a 60fps
4. **Fractional Indexing:** Permite reordenação sem atualizar todos os registros (apenas o item movido)
5. **CSS Variables + Tailwind v4:** Sistema de design tokens flexível que suporta temas dinâmicos
6. **Debounce de 500ms:** Equilíbrio entre responsividade e número de writes no Convex
7. **App Router (Next.js):** Route groups `(auth)` e `(dashboard)` para layouts separados
8. **Script inline no `<head>`:** Evita FOUC (Flash of Unstyled Content) ao carregar tema do localStorage

---

## 🏗️ Migração de Dados

### Framework de Migrações (`@convex-dev/migrations`)

O projeto usa o componente oficial de migrações do Convex para migrações seguras em produção:
- **Arquivo:** `convex/migrations/index.ts`
- Paginação automática para datasets grandes
- Tracking de progresso (resumable)
- Dry-run para preview

**Executar via CLI:**
```bash
npx convex run migrations:run '{fn: "migrations:nomeDaMigracao"}'
```

### Migrações Legacy (arquivos antigos)
Os arquivos `convex/credits/migrate.ts` e `convex/nodes/migrate.ts` contêm migrações manuais para:
- Criar registro de créditos com saldo 50 para usuários existentes
- Desbloquear temas default para todos
- Backfill de `nodeCount` em workspaces

---

## 🛡️ Rate Limiting (`@convex-dev/rate-limiter`)

### Configuração (`convex/rateLimits.ts`)

Proteção anti-abuse em todas as mutations públicas:

| Operação | Limite | Tipo | Período |
|---|---|---|---|
| `createNode` | 30 | token bucket | minuto |
| `updateNode` | 60 | token bucket | minuto |
| `duplicateNode` | 10 | fixed window | minuto |
| `removeNode` | 30 | fixed window | minuto |
| `createWorkspace` | 5 | fixed window | hora |
| `removeWorkspace` | 10 | fixed window | hora |
| `unlockTheme` | 10 | fixed window | hora |
| `setActiveTheme` | 30 | fixed window | hora |
| `nodeCreationCredits` | 5 | fixed window | dia |

### Uso nas Mutations

```typescript
import { rateLimiter } from "../rateLimits";

// Throws automaticamente se rate limit excedido
await rateLimiter.limit(ctx, "createNode", { key: userId });

// Ou verifica sem throw
const result = await rateLimiter.limit(ctx, "nodeCreationCredits", {
  key: userId,
  throws: false,
});
if (result.ok) {
  // Ação permitida
}
```

### Tipos de Rate Limit
- **Token Bucket:** Permite bursts, recarrega gradualmente (bom para operações frequentes)
- **Fixed Window:** Limite fixo por período, reseta no fim (bom para operações limitadas)

---

*Este documento é a fonte de verdade do projeto Maiglia. Mantenha-o atualizado conforme o projeto evolui.*

  ## Regras Obrigatórias ao Escrever Código Convex

  ### 1. NUNCA use `.filter()` em queries - use `.withIndex()` SEMPRE
  ```typescript
  // ❌ PROIBIDO - escaneia tabela inteira
  const items = await ctx.db.query("orders")
    .filter(q => q.eq(q.field("status"), "pending"))
    .collect();

  // ✅ CORRETO - usa índice, vai direto aos dados
  const items = await ctx.db.query("orders")
    .withIndex("by_status", q => q.eq("status", "pending"))
    .collect();

  2. NUNCA use .collect() sem limite em tabelas que podem crescer

  // ❌ PROIBIDO - carrega todos os documentos
  const allUsers = await ctx.db.query("users").collect();

  // ✅ CORRETO - limita quantidade
  const users = await ctx.db.query("users").take(100);

  // ✅ CORRETO - usa paginação
  const users = await ctx.db.query("users").paginate(paginationOpts);

  3. SEMPRE crie índices no schema para campos usados em filtros

  // No schema.ts - criar índice para cada campo de busca
  export default defineSchema({
    orders: defineTable({
      userId: v.id("users"),
      status: v.string(),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_userId", ["userId"])
      .index("by_userId_status", ["userId", "status"]),
  });

  4. Para estatísticas/contagens, use dados pré-calculados

  // ❌ PROIBIDO - conta todos os documentos em tempo real
  const totalOrders = (await ctx.db.query("orders").collect()).length;

  // ✅ CORRETO - mantém contador pré-calculado no documento pai
  // Exemplo real: workspaces.nodeCount (incrementado em create/duplicate, decrementado em remove)
  const workspace = await ctx.db.get(workspaceId);
  return workspace?.nodeCount ?? 0;

  5. NUNCA faça múltiplas queries em loop

  // ❌ PROIBIDO - N queries separadas
  for (const id of userIds) {
    const user = await ctx.db.get(id);
  }

  // ✅ CORRETO - busca todos de uma vez
  const users = await Promise.all(userIds.map(id => ctx.db.get(id)));

  6. Tarefas pesadas vão em Actions, não em Queries/Mutations

  - Queries/Mutations: apenas leitura/escrita rápida no banco
  - Actions: chamadas a APIs externas, processamento pesado, IA, etc.
