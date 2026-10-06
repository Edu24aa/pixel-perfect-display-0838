import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Aperture } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientView } from "@/components/clientlens/ClientView";
import { AdminView } from "@/components/clientlens/AdminView";
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
  fetchProjectData,
  requestMilestoneAdjustment,
  updateMilestoneStatus,
} from "@/services/api";

const title = "ClientLens — Acompanhe suas entregas de software";
const description =
  "Portal de rastreamento de entregas para clientes: linha do tempo do projeto, aprovações de etapas e histórico auditável.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function stamp() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Index() {
  const [view, setView] = useState("client");
  const [projectData, setProjectData] = useState(defaultProject);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);
  const [isLoading, setIsLoading] = useState(true);

  const log = (text: string) =>
    setAudit((prev) => [{ id: crypto.randomUUID(), text, timestamp: stamp() }, ...prev]);

  const applyProjectSnapshot = (data: Awaited<ReturnType<typeof fetchProjectData>>) => {
    const nextProject = data.project ?? defaultProject;

    setProjectData({
      name: nextProject.name ?? defaultProject.name,
      client: nextProject.client ?? defaultProject.client,
      dueLabel: nextProject.dueLabel ?? defaultProject.dueLabel,
      overallStatus: nextProject.overallStatus ?? defaultProject.overallStatus,
    });
    setMilestones(Array.isArray(nextProject.milestones) ? nextProject.milestones : initialMilestones);
    setAudit(Array.isArray(data.auditLog) ? data.auditLog : initialAudit);
  };

  const loadProject = async () => {
    setIsLoading(true);

    try {
      const data = await fetchProjectData();
      applyProjectSnapshot(data);
    } catch (error) {
      console.error(error);
      setProjectData(defaultProject);
      setMilestones(initialMilestones);
      setAudit(initialAudit);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, []);

  const setStatus = async (id: string, status: MilestoneStatus) => {
    const milestone = Array.isArray(milestones) ? milestones.find((x) => x.id === id) : undefined;
    const nextDateLabel =
      status === "approved"
        ? `Aprovado em ${stamp()}`
        : status === "review"
          ? "Aguardando sua aprovação"
          : milestone?.dateLabel ?? "Sem data";

    try {
      await updateMilestoneStatus(id, status, nextDateLabel);
      const data = await fetchProjectData();
      applyProjectSnapshot(data);

      if (milestone) {
        log(`Equipe de TI alterou “${milestone.title}” para ${statusMeta[status].label}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const approve = async (id: string) => {
    try {
      await approveMilestone(id, projectData.client);
      const data = await fetchProjectData();
      applyProjectSnapshot(data);
    } catch (error) {
      console.error(error);
    }
  };

  const requestChange = async (id: string, feedback: string) => {
    try {
      await requestMilestoneAdjustment(id, feedback);
      const data = await fetchProjectData();
      applyProjectSnapshot(data);
    } catch (error) {
      console.error(error);
    }
  };

  const addMilestone = (title: string, dateLabel: string) => {
    setMilestones((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title, dateLabel, status: "pending", summary: dateLabel },
    ]);
    log(`Equipe de TI criou o marco “${title}”`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Carregando dados do projeto...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Aperture className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">ClientLens</span>
          </div>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="client">Área do Cliente</TabsTrigger>
              <TabsTrigger value="admin">Gestor / TI</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10" translate="no">
        {view === "client" ? (
          <ClientView
            project={projectData}
            milestones={milestones}
            onApprove={approve}
            onRequestChange={requestChange}
          />
        ) : (
          <AdminView
            project={projectData}
            milestones={milestones}
            audit={audit}
            onStatusChange={setStatus}
            onAddMilestone={addMilestone}
          />
        )}
      </main>
    </div>
  );
}
