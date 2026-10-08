import type { AuditEntry, Milestone } from "@/lib/clientlens-data";

export const API_BASE_URL = "http://localhost:3333/api";

export type ProjectApiResponse = {
  project: {
    id: string;
    name: string;
    client: string;
    dueLabel: string;
    overallStatus: string;
    accessCode?: string;
    milestones: Milestone[];
  };
  auditLog: AuditEntry[];
};

export type ManagerLoginResponse = {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
};

export type ManagerUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export async function fetchProjectData(): Promise<ProjectApiResponse> {
  const res = await fetch(`${API_BASE_URL}/project`);
  if (!res.ok) throw new Error("Falha ao carregar dados do projeto");
  return res.json();
}

export async function trackProject(code: string): Promise<ProjectApiResponse> {
  const res = await fetch(`${API_BASE_URL}/project/track/${encodeURIComponent(code)}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao consultar projeto por código");
  }

  return res.json();
}

export async function loginManager(credentials: { email: string; password: string }): Promise<ManagerLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao autenticar gestor");
  }

  return data;
}

export async function fetchUsers(): Promise<ManagerUser[]> {
  const res = await fetch(`${API_BASE_URL}/users`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao carregar usuários");
  }

  return res.json();
}

export async function createUser(userData: { name: string; email: string; password: string; role?: string }): Promise<ManagerUser> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao cadastrar usuário");
  }

  return data;
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

export async function requestMilestoneAdjustment(id: string, reason: string, clientName?: string) {
  const res = await fetch(`${API_BASE_URL}/milestones/${id}/request-change`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, clientName }),
  });

  if (!res.ok) throw new Error("Falha ao solicitar ajuste");
  return res.json();
}

export async function fetchNotifications(): Promise<AuditEntry[]> {
  const res = await fetch(`${API_BASE_URL}/notifications`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao carregar notificações");
  }

  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<AuditEntry> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao marcar notificação como lida");
  }

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
