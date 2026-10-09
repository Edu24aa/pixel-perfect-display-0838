import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Aperture, Bell, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminView } from "@/components/clientlens/AdminView";
import { ClientView } from "@/components/clientlens/ClientView";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  clearManagerSession,
  formatUserRoleLabel,
  getManagerSession,
  isInternalUserRole,
  type ManagerSession,
} from "@/lib/auth";
import {
  initialAudit,
  initialMilestones,
  project as defaultProject,
  statusMeta,
  type AuditEntry,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/clientlens-data";
import {
  approveMilestone,
  createMilestone,
  createProject,
  deleteMilestone,
  deleteProject,
  fetchNotifications,
  fetchProjects,
  markNotificationAsRead,
  requestMilestoneAdjustment,
  trackProject,
  updateClientProfile,
  updateMilestone,
  updateMilestoneStatus,
} from "@/services/api";

export const Route = createFileRoute("/tracking")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
  }),
  component: TrackingPage,
});

function stamp() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TrackingPage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const [session, setSession] = useState<ManagerSession | null>(null);
  const isManager = Boolean(session && isInternalUserRole(session.role));

  const [view, setView] = useState<"client" | "admin">("client");
  const [projectData, setProjectData] = useState({
    ...defaultProject,
    clientEmail: defaultProject.clientEmail ?? "",
    clientPhone: defaultProject.clientPhone ?? "",
  });
  const [projects, setProjects] = useState<Array<{ id: string; name: string; client: string; dueLabel: string; accessCode?: string; progress?: number }>>([]);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);
  const [notifications, setNotifications] = useState<AuditEntry[]>([]);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const previousNotificationsRef = useRef(0);

  const applyProjectSnapshot = (data: Awaited<ReturnType<typeof trackProject>>) => {
    const nextProject = data.project ?? defaultProject;

    setProjectData({
      id: nextProject.id ?? defaultProject.id,
      name: nextProject.name ?? defaultProject.name,
      client: nextProject.client ?? defaultProject.client,
      clientEmail: nextProject.clientEmail ?? null,
      clientPhone: nextProject.clientPhone ?? null,
      dueLabel: nextProject.dueLabel ?? defaultProject.dueLabel,
      overallStatus: nextProject.overallStatus ?? defaultProject.overallStatus,
      accessCode: nextProject.accessCode ?? code ?? defaultProject.accessCode ?? "",
    });
    setMilestones(Array.isArray(nextProject.milestones) ? nextProject.milestones : initialMilestones);
    setAudit(Array.isArray(data.auditLog) ? data.auditLog : initialAudit);
  };

  const loadProject = async (trackingCode: string) => {
    if (!trackingCode.trim()) {
      setIsLoading(false);
      setError("Informe um código ou número da nota fiscal.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await trackProject(trackingCode.trim());
      applyProjectSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Projeto não encontrado");
      setProjectData({ ...defaultProject, clientEmail: defaultProject.clientEmail ?? "", clientPhone: defaultProject.clientPhone ?? "" });
      setMilestones(initialMilestones);
      setAudit(initialAudit);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectList = async () => {
    try {
      const nextProjects = await fetchProjects();
      setProjects(
        nextProjects.map((project) => ({
          id: project.id,
          name: project.name,
          client: project.client,
          dueLabel: project.dueLabel,
          accessCode: project.accessCode ?? "",
          progress: Math.max(0, Math.min(100, Math.round((project.milestones?.filter((item) => item.status === "approved").length ?? 0) / Math.max(1, project.milestones?.length ?? 1) * 100))),
        })),
      );
    } catch (err) {
      console.error("Erro ao carregar lista de projetos:", err);
    }
  };

  useEffect(() => {
    setSession(getManagerSession());
  }, []);

  useEffect(() => {
    void loadProjectList();
  }, []);

  useEffect(() => {
    void loadProject(code);
  }, [code]);

  useEffect(() => {
    if (!isManager) {
      setView("client");
    } else {
      setView("admin");
    }
  }, [isManager]);

  const loadNotifications = async () => {
    try {
      const nextNotifications = await fetchNotifications();
      setNotifications(nextNotifications);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  };

  useEffect(() => {
    if (!isManager) {
      setNotifications([]);
      setNotificationToast(null);
      return;
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [isManager]);

  useEffect(() => {
    const unread = notifications.filter((item) => !item.read);
    if (unread.length > previousNotificationsRef.current) {
      const newest = unread[0];
      setNotificationToast(`Nova Notificação: ${newest.text}`);
      window.setTimeout(() => setNotificationToast(null), 4000);
    }
    previousNotificationsRef.current = unread.length;
  }, [notifications]);

  const log = (text: string) => {
    setAudit((current) => [{ id: crypto.randomUUID(), text, timestamp: stamp() }, ...current]);
  };

  const setStatus = async (id: string, status: MilestoneStatus) => {
    const milestone = milestones.find((item) => item.id === id);
    const nextDateLabel =
      status === "approved"
        ? `Aprovado em ${stamp()}`
        : status === "review"
          ? "Aguardando sua aprovação"
          : milestone?.dateLabel ?? "Sem data";

    try {
      await updateMilestoneStatus(id, status, nextDateLabel);
      const data = await trackProject(code || projectData.accessCode || defaultProject.accessCode);
      applyProjectSnapshot(data);

      if (milestone) {
        log(`Equipe de TI alterou “${milestone.title}” para ${statusMeta[status].label}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const approve = async (id: string) => {
    try {
      await approveMilestone(id, projectData.client);
      const data = await trackProject(code || projectData.accessCode || defaultProject.accessCode);
      applyProjectSnapshot(data);
    } catch (err) {
      console.error(err);
    }
  };

  const requestChange = async (id: string, feedback: string, clientName?: string) => {
    try {
      await requestMilestoneAdjustment(id, feedback, clientName);
      const data = await trackProject(code || projectData.accessCode || defaultProject.accessCode);
      applyProjectSnapshot(data);
      void loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (payload: { name: string; email: string; phone: string }) => {
    try {
      await updateClientProfile({
        code: projectData.accessCode || code,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
      });
      const data = await trackProject(projectData.accessCode || code || defaultProject.accessCode);
      applyProjectSnapshot(data);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      window.alert(err instanceof Error ? err.message : "Não foi possível atualizar o perfil.");
    }
  };

  const handleCreateMilestone = async (payload: { projectId: string; title: string; description?: string; dueDate?: string; status?: string }) => {
    try {
      await createMilestone(payload);
      const data = await trackProject(projectData.accessCode || code || defaultProject.accessCode);
      applyProjectSnapshot(data);
      void loadProjectList();
    } catch (err) {
      console.error("Erro ao criar marco:", err);
      throw err;
    }
  };

  const handleUpdateMilestone = async (id: string, payload: { projectId?: string; title?: string; description?: string; dueDate?: string; status?: string }) => {
    try {
      await updateMilestone(id, payload);
      const data = await trackProject(projectData.accessCode || code || defaultProject.accessCode);
      applyProjectSnapshot(data);
      void loadProjectList();
    } catch (err) {
      console.error("Erro ao atualizar marco:", err);
      throw err;
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await deleteMilestone(id);
      const data = await trackProject(projectData.accessCode || code || defaultProject.accessCode);
      applyProjectSnapshot(data);
      void loadProjectList();
    } catch (err) {
      console.error("Erro ao excluir marco:", err);
      throw err;
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    const selected = projects.find(
      (project) => project.id === projectId || project.accessCode === projectId,
    );

    const nextCode = selected?.accessCode ?? projectId;
    if (!nextCode) {
      return;
    }

    await navigate({ to: "/tracking", search: { code: nextCode } });
    void loadProjectList();
  };

  const handleCreateProject = async (payload: {
    name: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    accessCode?: string;
    dueLabel?: string;
    overallStatus?: string;
  }) => {
    try {
      const project = await createProject({
        name: payload.name,
        clientName: payload.clientName,
        clientEmail: payload.clientEmail ?? null,
        clientPhone: payload.clientPhone ?? null,
        accessCode: payload.accessCode,
        dueLabel: payload.dueLabel,
        overallStatus: payload.overallStatus,
      });

      await loadProjectList();
      if (project.accessCode) {
        await navigate({ to: "/tracking", search: { code: project.accessCode } });
      }

      toast.success(`Projeto "${project.name}" criado com sucesso.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar projeto";
      toast.error(message);
      throw err;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const target = projects.find((item) => item.id === projectId) ?? projectData;
    if (!target?.name) {
      return;
    }

    try {
      await deleteProject(projectId);
      const remainingProjects = projects.filter((item) => item.id !== projectId);

      if (remainingProjects.length > 0) {
        const nextProject = remainingProjects[0];
        await navigate({ to: "/tracking", search: { code: nextProject.accessCode ?? nextProject.id } });
      } else {
        await navigate({ to: "/" });
      }

      await loadProjectList();
      toast.success(`Projeto "${target.name}" foi excluído.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao excluir o projeto";
      toast.error(message);
      throw err;
    }
  };

  const handleLogout = () => {
    clearManagerSession();
    setSession(null);
    void navigate({ to: "/login" });
  };

  const unreadNotificationsCount = notifications.filter((item) => !item.read).length;

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {notificationToast ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-red-500/50 bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-950/40">
            <span className="inline-block size-2.5 animate-pulse rounded-full bg-white" />
            {notificationToast}
          </div>
        </div>
      ) : null}

      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30">
              <Aperture className="size-5" />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-[0.12em] text-cyan-300">ClientLens</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Acompanhamento</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isManager ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 md:flex">
                  <span className="font-medium text-slate-50">{session?.name ?? "Usuário"}</span>
                  <span className="text-slate-400">•</span>
                  <span>{formatUserRoleLabel(session?.role)}</span>
                </div>

                <Select value={projectData.accessCode ?? ""} onValueChange={(next) => void handleProjectSelect(next)}>
                  <SelectTrigger className="w-[220px] border-slate-700 bg-slate-800 text-slate-100">
                    <SelectValue placeholder="Projeto ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((projectItem) => (
                      <SelectItem key={projectItem.id} value={projectItem.accessCode ?? projectItem.id}>
                        {projectItem.name} · {projectItem.client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tabs value={view} onValueChange={(next) => setView(next as "client" | "admin")}>
                  <TabsList>
                    <TabsTrigger value="client">Área do Cliente</TabsTrigger>
                    <TabsTrigger value="admin">Gestor / TI</TabsTrigger>
                  </TabsList>
                </Tabs>

                <button
                  type="button"
                  className="relative inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-2 text-sm text-slate-100"
                  aria-label="Notificações"
                >
                  <Bell className="size-4" />
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/60 animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  ) : null}
                </button>

                <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-200 hover:bg-slate-800">
                  <LogOut className="mr-2 size-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                  <ShieldCheck className="mr-2 size-4" />
                  Acesso Gestor / TI
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-300">
            Carregando projeto...
          </div>
        ) : (
          <>
            {view === "client" || !isManager ? (
              <ClientView project={projectData} milestones={milestones} onApprove={approve} onRequestChange={requestChange} onSaveProfile={handleSaveProfile} />
            ) : (
              <AdminView
                project={projectData}
                milestones={milestones}
                audit={audit}
                notifications={notifications}
                projectList={projects}
                onMarkNotificationRead={handleMarkNotificationRead}
                onStatusChange={setStatus}
                onProjectSelect={handleProjectSelect}
                onCreateProject={handleCreateProject}
                onCreateMilestone={handleCreateMilestone}
                onUpdateMilestone={handleUpdateMilestone}
                onDeleteMilestone={handleDeleteMilestone}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </>
        )}

        {session && !isManager ? (
          <div className="mt-4 text-left text-sm text-slate-400">
            Sessão do gestor expirada. <Link to="/login" className="text-cyan-300 underline">Fazer login novamente</Link>.
          </div>
        ) : null}
      </main>
    </div>
  );
}
