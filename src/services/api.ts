import type { AuditEntry, Milestone } from "@/lib/clientlens-data";

export const API_BASE_URL = "http://localhost:3333/api";

export type ProjectApiResponse = {
  project: {
    id: string;
    name: string;
    client: string;
    clientEmail?: string | null;
    clientPhone?: string | null;
    dueLabel: string;
    overallStatus: string;
    accessCode?: string;
    milestones: Milestone[];
  };
  auditLog: AuditEntry[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  client: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  dueLabel: string;
  overallStatus: string;
  accessCode?: string;
  milestones?: Milestone[];
  createdAt?: string;
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

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE_URL}/projects`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao carregar projetos");
  }

  return res.json();
}

export async function createProject(payload: {
  name: string;
  clientName?: string;
  client?: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  accessCode?: string;
  dueLabel?: string;
  overallStatus?: string;
  milestones?: Array<{
    title: string;
    summary?: string;
    dateLabel?: string;
    status?: string;
    orderIndex?: number;
  }>;
}): Promise<ProjectSummary> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao cadastrar projeto");
  }

  return data;
}

export async function fetchProjectById(id: string): Promise<ProjectApiResponse> {
  const res = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao carregar projeto");
  }

  return res.json();
}

export async function updateProject(id: string, payload: Partial<ProjectSummary>) {
  const res = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao atualizar projeto");
  }

  return res.json();
}

export async function deleteProject(id: string) {
  const res = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao excluir projeto");
  }
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

export async function updateUser(id: string, userData: { name?: string; email?: string; role?: string }): Promise<ManagerUser> {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao atualizar usuário");
  }

  return data;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao excluir usuário");
  }
}

export async function updateClientProfile(payload: { projectId?: string; code?: string; name?: string; email?: string; phone?: string }) {
  const res = await fetch(`${API_BASE_URL}/client/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao atualizar perfil do cliente");
  }

  return data;
}

export async function createMilestone(payload: {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: string;
  orderIndex?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao criar marco de entrega");
  }

  return data;
}

export async function updateMilestone(id: string, payload: Partial<Milestone> & { projectId?: string; description?: string; dueDate?: string; orderIndex?: number }) {
  const res = await fetch(`${API_BASE_URL}/milestones/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao atualizar marco de entrega");
  }

  return data;
}

export async function deleteMilestone(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/milestones/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error ?? "Falha ao excluir marco de entrega");
  }
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
