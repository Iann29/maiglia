# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos de Desenvolvimento

```bash
npm run dev              # Inicia frontend (Next.js Turbopack) + backend (Convex) em paralelo
npm run dev:frontend     # Apenas frontend: next dev --turbopack
npm run dev:backend      # Apenas backend: convex dev
npm run build            # Build de produção: next build
npm run lint             # ESLint (ignora convex/_generated)
```

HTTPS local (requer certificados mkcert para `dev.maiglia.com`):
```bash
npm run dev:https        # Frontend HTTPS + backend Convex em paralelo
```

## Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Framer Motion
- **Backend**: Convex (BaaS com queries/mutations reativas em tempo real)
- **Auth**: Better Auth via `@convex-dev/better-auth` (email + senha)
- **Idioma da UI**: Português brasileiro (mensagens de erro, labels, etc.)

## Arquitetura

### Estrutura de Rotas (App Router)

- `src/app/(auth)/` — Login e cadastro (públicas)
- `src/app/(dashboard)/` — Área autenticada (dashboard, temas, minha-conta)
- `src/app/api/auth/[...all]/` — Catch-all route do Better Auth

### Backend Convex (`convex/`)

Funções organizadas por domínio:
- `convex/workspaces/` — CRUD de workspaces (hierárquicos)
- `convex/nodes/` — CRUD de nodes (blocos no canvas)
- `convex/themes/` — Queries e mutations de temas
- `convex/credits/` — Sistema de créditos (saldo, transações)
- `convex/preferences/` — Preferências do usuário (tema ativo)

Arquivos centrais:
- `convex/schema.ts` — Schema principal (NÃO inclui tabelas do Better Auth)
- `convex/auth.ts` — Configuração do Better Auth (createAuth, authComponent)
- `convex/convex.config.ts` — Componentes: betterAuth, rateLimiter, migrations, aggregate
- `convex/rateLimits.ts` — Rate limits por operação (token bucket / fixed window)
- `convex/lib/auth.ts` — Helpers de auth para usar dentro de queries/mutations
- `convex/lib/constants.ts` — Constantes duplicadas do frontend (Convex não importa de `src/`)

### Sistema Dual de Autenticação

Regra: **Queries → Fast (JWT ~0ms)**, **Mutations → Full (DB ~800ms)**

```typescript
// Em queries:
import { requireAuthFast } from "../lib/auth";
const user = await requireAuthFast(ctx);

// Em mutations:
import { requireAuth } from "../lib/auth";
const user = await requireAuth(ctx);
```

- Client-side: `src/lib/auth-client.ts` — `useSession`, `signIn`, `signUp`, `signOut`
- Server-side: `src/lib/auth-server.ts` — `isAuthenticated`, `preloadAuthQuery`, `fetchAuthQuery`

### Hierarquia de Workspaces

Parent Workspace (categoria) → Sub-workspaces (páginas). Conteúdo (nodes) vive nos sub-workspaces.
Ao criar um parent, um sub-workspace "Geral" é criado automaticamente.
Ordenação via fractional indexing (campo `index` como string).

### Sistema de Temas

- Temas definidos no banco (tabela `themes`) com cores, fonte, preço em créditos
- CSS variables (`--bg-primary`, `--fg-primary`, `--accent`, `--node-color-{1-8}`, etc.)
- Script de hidratação inline no `<head>` do root layout para evitar FOUC (lê de `localStorage`)
- Cache key: `maiglia-active-theme-slug` no localStorage
- Cores lidas via CSS variables em runtime: `src/constants/colors.ts` (`getNodeColorsFromTheme()`)

### Providers (ordem de aninhamento)

`ConvexBetterAuthProvider` → `ThemeProvider` → App

### Path Alias

`@/*` → `./src/*`

## Convenções Importantes

- Constantes compartilhadas entre frontend e Convex são **duplicadas** em `src/constants/` e `convex/lib/constants.ts` — altere em ambos
- Tabelas do Better Auth ficam isoladas no componente `convex/betterAuth/` — nunca adicionar ao `convex/schema.ts`
- Mutations devem verificar rate limits via `rateLimiter.limit()` e autenticação via `requireAuth()`
- Arquivos `convex/_generated/` são auto-gerados — nunca editar manualmente
