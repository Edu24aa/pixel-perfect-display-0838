import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Aperture, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const requestChange = async (id: string, feedback: string) => {
    try {
      await requestMilestoneAdjustment(id, feedback);
      const data = await trackProject(code);
      applyProjectSnapshot(data);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
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
