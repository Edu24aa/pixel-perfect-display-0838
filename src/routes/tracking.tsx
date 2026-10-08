import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Aperture, ArrowLeft, Bell, LogOut, ShieldCheck } from "lucide-react";

import { AdminView } from "@/components/clientlens/AdminView";
import { ClientView } from "@/components/clientlens/ClientView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clearManagerSession, getManagerSession, isManagerAuthenticated } from "@/lib/auth";
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
  fetchNotifications,
  markNotificationAsRead,
  requestMilestoneAdjustment,
  trackProject,
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
  const isManager = isManagerAuthenticated();
  const session = useMemo(() => getManagerSession(), []);

  const [view, setView] = useState<"client" | "admin">("client");
  const [projectData, setProjectData] = useState(defaultProject);
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
      name: nextProject.name ?? defaultProject.name,
      client: nextProject.client ?? defaultProject.client,
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
      setProjectData(defaultProject);
      setMilestones(initialMilestones);
      setAudit(initialAudit);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProject(code);
  }, [code]);

  useEffect(() => {
    if (!isManager) {
      setView("client");
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
      const data = await trackProject(code);
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
      const data = await trackProject(code);
      applyProjectSnapshot(data);
    } catch (err) {
      console.error(err);
    }
  };

  const requestChange = async (id: string, feedback: string, clientName?: string) => {
    try {
      await requestMilestoneAdjustment(id, feedback, clientName);
      const data = await trackProject(code);
      applyProjectSnapshot(data);
      void loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const addMilestone = (title: string, dateLabel: string) => {
    setMilestones((current) => [
      ...current,
      { id: crypto.randomUUID(), title, dateLabel, status: "pending", summary: dateLabel },
    ]);
    log(`Equipe de TI criou o marco “${title}”`);
  };

  const handleLogout = () => {
    clearManagerSession();
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
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-300">
            Carregando projeto...
          </div>
        ) : (
          <>
            {view === "client" || !isManager ? (
              <ClientView project={projectData} milestones={milestones} onApprove={approve} onRequestChange={requestChange} />
            ) : (
              <AdminView
                project={projectData}
                milestones={milestones}
                audit={audit}
                notifications={notifications}
                onMarkNotificationRead={handleMarkNotificationRead}
                onStatusChange={setStatus}
                onAddMilestone={addMilestone}
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
