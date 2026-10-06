import type { AuditEntry, Milestone } from "@/lib/clientlens-data";

export const API_BASE_URL = "http://localhost:3333/api";

export type ProjectApiResponse = {
  project: {
    id: string;
    name: string;
    client: string;
    dueLabel: string;
    overallStatus: string;
    milestones: Milestone[];
  };
  auditLog: AuditEntry[];
};

export async function fetchProjectData(): Promise<ProjectApiResponse> {
  const res = await fetch(`${API_BASE_URL}/project`);
  if (!res.ok) throw new Error("Falha ao carregar dados do projeto");
  return res.json();
}

export async function approveMilestone(id: string, clientName: string) {
  const res = await fetch(`${API_BASE_URL}/milestones/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientName }),
  });

  if (!res.ok) throw new Error("Falha ao homologar marco");
  return res.json();
}

export async function requestMilestoneAdjustment(id: string, reason: string) {
  const res = await fetch(`${API_BASE_URL}/milestones/${id}/request-change`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) throw new Error("Falha ao solicitar ajuste");
  return res.json();
}

export async function updateMilestoneStatus(id: string, status: string, dateLabel?: string) {
  const res = await fetch(`${API_BASE_URL}/milestones/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, dateLabel }),
  });

  if (!res.ok) throw new Error("Falha ao atualizar status da etapa");
  return res.json();
}
