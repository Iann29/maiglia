/**
 * Configuração de Agregados (Contadores Denormalizados)
 *
 * Usa o componente oficial @convex-dev/aggregate para manter
 * contagens e somas de forma escalável e O(log n).
 *
 * NOTA: Este arquivo configura os agregados, mas a integração completa
 * requer refatorar as mutations para usar increment/decrement.
 * Por ora, o sistema continua usando o campo nodeCount manual nos workspaces.
 *
 * Agregados disponíveis para uso futuro:
 * - Contagem de nodes por workspace
 * - Contagem de workspaces por usuário
 * - Contagem de temas desbloqueados por usuário
 */

// O componente Aggregate requer configuração mais complexa com TableAggregate
// e triggers para manter sincronizado. Por ora, mantemos o contador manual.
// Veja: https://www.convex.dev/components/aggregate

// Exemplo de como seria a configuração completa:
//
// import { TableAggregate } from "@convex-dev/aggregate";
// import { components } from "./_generated/api";
// import { DataModel } from "./_generated/dataModel";
//
// // Contador de nodes por workspace
// export const nodesByWorkspace = new TableAggregate<{
//   Namespace: string; // workspaceId
//   Key: number; // createdAt para ordenação
//   DataModel: DataModel;
//   TableName: "nodes";
// }>(components.aggregate, {
//   namespace: (doc) => doc.workspaceId,
//   sortKey: (doc) => doc.createdAt,
// });

export {};
