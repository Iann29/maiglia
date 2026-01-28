/**
 * Configuração de Rate Limits para proteção anti-abuse
 *
 * Usa o componente oficial @convex-dev/rate-limiter para limitar
 * a frequência de operações por usuário.
 *
 * Tipos de limite:
 * - token bucket: permite bursts, recarrega gradualmente
 * - fixed window: limite fixo por período (reseta no fim)
 */

import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // ============================================================
  // Operações de Nodes
  // ============================================================

  // Criação de nodes: 30/minuto (token bucket para permitir bursts)
  createNode: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 30,
  },

  // Update de nodes: 60/minuto (permitir edição fluida)
  updateNode: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 60,
  },

  // Duplicação de nodes: 10/minuto
  duplicateNode: {
    kind: "fixed window",
    rate: 10,
    period: MINUTE,
  },

  // Remoção de nodes: 30/minuto
  removeNode: {
    kind: "fixed window",
    rate: 30,
    period: MINUTE,
  },

  // ============================================================
  // Operações de Workspaces
  // ============================================================

  // Criação de workspaces: 5/hora
  createWorkspace: {
    kind: "fixed window",
    rate: 5,
    period: HOUR,
  },

  // Remoção de workspaces: 10/hora
  removeWorkspace: {
    kind: "fixed window",
    rate: 10,
    period: HOUR,
  },

  // ============================================================
  // Operações de Temas
  // ============================================================

  // Desbloqueio de temas: 10/hora
  unlockTheme: {
    kind: "fixed window",
    rate: 10,
    period: HOUR,
  },

  // Ativação de temas: 30/hora
  setActiveTheme: {
    kind: "fixed window",
    rate: 30,
    period: HOUR,
  },
});
