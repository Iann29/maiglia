/**
 * Estrutura fixa dos workspaces do Maiglia
 *
 * Estas categorias e sub-páginas são pré-definidas para todos os usuários.
 * A seed no backend (convex/workspaces/seed.ts) cria esses workspaces
 * automaticamente quando o usuário entra pela primeira vez.
 *
 * Para adicionar/modificar categorias no futuro, altere também o seed.
 */

export interface FixedCategory {
  name: string;
  iconName: string;
  color: string;
  subPages: string[];
}

export const FIXED_WORKSPACES: FixedCategory[] = [
  {
    name: "Casa",
    iconName: "House",
    color: "#22c55e",
    subPages: ["Lista do Mercado", "Rotina de Limpeza", "Compras e Afazeres"],
  },
  {
    name: "Finanças",
    iconName: "CurrencyDollar",
    color: "#f97316",
    subPages: [
      "Meu Financeiro",
      "Logins e Senhas",
      "Metas Financeiras",
      "Itens de Desejo",
      "Viagem - Custos",
    ],
  },
  {
    name: "Estudos",
    iconName: "BookOpen",
    color: "#3b82f6",
    subPages: ["Estudos", "Caderno", "Livros"],
  },
  {
    name: "Saúde",
    iconName: "Heartbeat",
    color: "#ec4899",
    subPages: ["Medidas", "Planilhas de Treino", "Dieta", "Saúde", "Beleza"],
  },
  {
    name: "Vida",
    iconName: "Star",
    color: "#8b5cf6",
    subPages: [
      "Sobre Mim",
      "Minhas Metas",
      "Minha Semana",
      "Meu Mês",
      "Minha Agenda",
    ],
  },
];
