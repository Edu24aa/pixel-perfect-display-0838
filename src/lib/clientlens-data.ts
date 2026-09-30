export type MilestoneStatus = "pending" | "in_progress" | "review" | "approved";

export type Milestone = {
  id: string;
  title: string;
  status: MilestoneStatus;
  dateLabel: string;
  summary: string;
  demoUrl?: string;
};

export type AuditEntry = {
  id: string;
  text: string;
  timestamp: string;
};

export type AdminProject = {
  id: string;
  name: string;
  client: string;
  owner: string;
  due: string;
  progress: number;
  statusLabel: string;
};

export const statusMeta: Record<
  MilestoneStatus,
  { label: string; tone: "success" | "warning" | "info" | "muted" }
> = {
  pending: { label: "Pendente", tone: "muted" },
  in_progress: { label: "Em Desenvolvimento", tone: "info" },
  review: { label: "Pronto para Homologação", tone: "warning" },
  approved: { label: "Aprovado", tone: "success" },
};

export const statusOrder: MilestoneStatus[] = [
  "pending",
  "in_progress",
  "review",
  "approved",
];

export const project = {
  name: "Migração de Gateway de Pagamento v2",
  client: "Nordeste Varejo S.A.",
  dueLabel: "24 de Outubro",
  overallStatus: "Em Homologação",
};

export const initialMilestones: Milestone[] = [
  {
    id: "m1",
    title: "Alinhamento e Arquitetura",
    status: "approved",
    dateLabel: "Concluído em 10/Out",
    summary:
      "Definimos o escopo, os fluxos de pagamento e a arquitetura da integração junto ao seu time financeiro.",
  },
  {
    id: "m2",
    title: "Desenvolvimento de APIs e Integração Bancária",
    status: "approved",
    dateLabel: "Concluído em 18/Out",
    summary:
      "Conectamos o sistema ao banco parceiro e validamos transações de teste ponta a ponta.",
  },
  {
    id: "m3",
    title: "Homologação do Fluxo de Checkout",
    status: "review",
    dateLabel: "Aguardando sua aprovação",
    summary:
      "Implementamos a tela de checkout com validação de cartão e suporte a Pix.",
    demoUrl: "https://checkout-homolog.exemplo.com",
  },
  {
    id: "m4",
    title: "Publicação em Produção e Monitoramento",
    status: "pending",
    dateLabel: "Previsto para 24/Out",
    summary:
      "Subida controlada em produção, acompanhamento das primeiras transações reais e relatório final.",
  },
];

export const initialAudit: AuditEntry[] = [
  {
    id: "a1",
    text: "Nordeste Varejo aprovou a etapa “Desenvolvimento de APIs e Integração Bancária”",
    timestamp: "18/Out às 14:32",
  },
  {
    id: "a2",
    text: "Nordeste Varejo aprovou a etapa “Alinhamento e Arquitetura”",
    timestamp: "10/Out às 09:15",
  },
  {
    id: "a3",
    text: "Equipe de TI marcou “Homologação do Fluxo de Checkout” como pronto para homologação",
    timestamp: "19/Out às 17:04",
  },
];

export const adminProjects: AdminProject[] = [
  {
    id: "p1",
    name: "Migração de Gateway de Pagamento v2",
    client: "Nordeste Varejo S.A.",
    owner: "Camila Duarte",
    due: "24/Out",
    progress: 75,
    statusLabel: "Em Homologação",
  },
  {
    id: "p2",
    name: "Portal de Autoatendimento B2B",
    client: "Lumen Indústria",
    owner: "Rafael Nunes",
    due: "07/Nov",
    progress: 40,
    statusLabel: "Em Desenvolvimento",
  },
  {
    id: "p3",
    name: "App de Rastreio de Frota",
    client: "TransSul Logística",
    owner: "Ana Prado",
    due: "12/Dez",
    progress: 15,
    statusLabel: "Descoberta",
  },
];

export function progressFor(milestones: Milestone[]) {
  // Uma etapa conta como concluída quando o trabalho foi entregue
  // (em desenvolvimento pós-aprovação, em homologação ou aprovada).
  const done = milestones.filter((m) => m.status !== "pending").length;
  return {
    done,
    total: milestones.length,
    percent: Math.round((done / milestones.length) * 100),
  };
}
