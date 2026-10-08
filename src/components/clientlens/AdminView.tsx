import { useEffect, useState } from "react";
import { Bell, History, Plus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminProjects,
  progressFor,
  statusMeta,
  statusOrder,
  type AuditEntry,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/clientlens-data";
import { createUser, fetchUsers, type ManagerUser } from "@/services/api";
import { StatusPill } from "./StatusPill";

type Props = {
  project: {
    name: string;
    client: string;
    dueLabel: string;
    overallStatus: string;
    accessCode?: string;
  };
  milestones: Milestone[];
  audit: AuditEntry[];
  notifications: AuditEntry[];
  onMarkNotificationRead: (id: string) => Promise<void> | void;
  onStatusChange: (id: string, status: MilestoneStatus) => Promise<void> | void;
  onAddMilestone: (title: string, dateLabel: string) => void;
};

export function AdminView({
  project,
  milestones,
  audit,
  notifications,
  onMarkNotificationRead,
  onStatusChange,
  onAddMilestone,
}: Props) {
  const [open, setOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [shareClientName, setShareClientName] = useState(project.client);
  const [sharePhone, setSharePhone] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [users, setUsers] = useState<ManagerUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MANAGER",
  });

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case "CONSULTANT":
      case "CONSULTOR":
        return "Consultor(a)";
      case "ADMIN":
        return "Administrador(a)";
      case "MANAGER":
      case "GESTOR":
      default:
        return "Gestor(a)";
    }
  };
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<AuditEntry | null>(null);
  const current = progressFor(milestones);
  const unreadNotifications = notifications.filter((item) => !item.read);

  const directAccessLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?code=${encodeURIComponent(project.accessCode ?? "")}`
      : `http://localhost:3000/?code=${encodeURIComponent(project.accessCode ?? "")}`;
  const shareMessage = [
    `Olá, ${shareClientName || "Cliente"}! Seu projeto ${project.name} já está disponível para acompanhamento no ClientLens.`,
    "",
    `Acesse pelo link: ${directAccessLink}`,
    "",
    `Código/NF: ${project.accessCode ?? "NF-2024-001"}`,
  ].join("\n");

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const nextUsers = await fetchUsers();
      setUsers(nextUsers);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setUserError("Preencha nome, e-mail e senha para cadastrar o gestor.");
      setUserSuccess("");
      return;
    }

    try {
      setUserError("");
      await createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
      });

      setUserSuccess("Gestor cadastrado com sucesso.");
      setUserForm({ name: "", email: "", password: "", role: "MANAGER" });
      await loadUsers();
      setUserDialogOpen(false);
    } catch (error) {
      setUserSuccess("");
      setUserError(error instanceof Error ? error.message : "Falha ao cadastrar gestor.");
    }
  };

  const normalizeWhatsAppPhone = (value: string) => value.replace(/\D/g, "");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directAccessLink);
      setCopyFeedback("Link copiado!");
      window.setTimeout(() => setCopyFeedback(""), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      setCopyFeedback("Não foi possível copiar automaticamente.");
      window.setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    const phone = normalizeWhatsAppPhone(sharePhone);
    if (!phone) {
      window.alert("Informe o telefone com DDD antes de enviar via WhatsApp.");
      return;
    }

    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = () => {
    if (!shareEmail.trim()) {
      window.alert("Informe um e-mail do cliente antes de enviar por e-mail.");
      return;
    }

    const subject = `Acesso ao projeto ${project.name}`;
    const url = `mailto:${shareEmail.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
    window.location.href = url;
  };

  const handleOpenNotification = async (notification: AuditEntry) => {
    setSelectedNotification(notification);
    await onMarkNotificationRead(notification.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Painel interno</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projetos ativos, status das etapas e histórico de aprovações.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShareClientName(project.client);
              setSharePhone("");
              setShareEmail("");
              setCopyFeedback("");
              setShareDialogOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition-colors hover:bg-cyan-400"
          >
            Enviar Acesso ao Cliente
          </button>

          <button
            type="button"
            className="relative inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100"
            aria-label="Notificações pendentes"
          >
            <Bell className="size-4" />
            Sugestões
            {unreadNotifications.length > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/60 animate-pulse">
                {unreadNotifications.length}
              </span>
            ) : null}
          </button>

          <Button variant="outline" onClick={() => setUserDialogOpen(true)}>
            <UserPlus className="mr-2 size-4" /> Novo Usuário
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus /> Novo Marco de Entrega
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="w-44">Progresso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminProjects.map((p) => {
              const percent = p.name === project.name ? current.percent : p.progress;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.client}</TableCell>
                  <TableCell className="text-muted-foreground">{p.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{p.due}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percent} className="h-1.5" />
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Etapas — {project.name}
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-foreground">{m.title}</p>
                <p className="text-sm text-muted-foreground">{m.dateLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={m.status} />
                <Select
                  value={m.status}
                  onValueChange={(v) => onStatusChange(m.id, v as MilestoneStatus)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOrder.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusMeta[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <History className="size-4" /> Histórico de aprovações
          </h2>
        </div>
        <ul className="mt-4 space-y-3">
          {audit.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
              <span className="text-foreground/80">{a.text}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">{a.timestamp}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Sugestões e Ajustes dos Clientes
          </h2>
          {unreadNotifications.length > 0 ? (
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-200">
              {unreadNotifications.length} pendente{unreadNotifications.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma sugestão ou ajuste pendente.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleOpenNotification(notification)}
                className={[
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  !notification.read
                    ? "border-red-500/40 bg-red-500/5 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.08)]"
                    : "border-border bg-transparent",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  {!notification.read ? (
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-red-500 animate-pulse" />
                  ) : (
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-slate-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={notification.read ? "text-sm text-foreground/80" : "text-sm font-medium text-red-100"}>
                      {notification.text}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.timestamp || new Date(notification.createdAt ?? Date.now()).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {!notification.read ? (
                    <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-red-200">
                      Novo
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Gestores cadastrados
        </h2>

        {isLoadingUsers ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando gestores...</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum gestor cadastrado no momento.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRoleLabel(user.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog open={Boolean(selectedNotification)} onOpenChange={(openState) => !openState && setSelectedNotification(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Visualizar sugestão do cliente</DialogTitle>
            <DialogDescription>Detalhe da mensagem recebida e status de leitura.</DialogDescription>
          </DialogHeader>

          {selectedNotification ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm font-medium text-red-100">{selectedNotification.text}</p>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                <span>Data</span>
                <span>{selectedNotification.timestamp || new Date(selectedNotification.createdAt ?? Date.now()).toLocaleString("pt-BR")}</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Esta mensagem foi marcada como lida ao abrir o detalhe e saiu da lista de alertas pendentes.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setSelectedNotification(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={userDialogOpen}
        onOpenChange={(openState) => {
          setUserDialogOpen(openState);
          if (!openState) {
            setUserForm({ name: "", email: "", password: "", role: "MANAGER" });
            setUserError("");
            setUserSuccess("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário / Gestor</DialogTitle>
            <DialogDescription>
              Cadastre um novo gestor para acessar o painel administrativo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={userForm.name}
              onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome completo"
            />
            <Input
              type="email"
              value={userForm.email}
              onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="E-mail corporativo"
            />
            <Input
              type="password"
              value={userForm.password}
              onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Senha inicial"
            />
            <Select
              value={userForm.role}
              onValueChange={(value) => setUserForm((current) => ({ ...current, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Gestor(a)</SelectItem>
                <SelectItem value="ADMIN">Administrador(a)</SelectItem>
                <SelectItem value="CONSULTANT">Consultor(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userError ? (
            <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {userError}
            </div>
          ) : null}

          {userSuccess ? (
            <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {userSuccess}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreateUser()}>Cadastrar Gestor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={shareDialogOpen}
        onOpenChange={(openState) => {
          setShareDialogOpen(openState);
          if (!openState) {
            setShareClientName(project.client);
            setSharePhone("");
            setShareEmail("");
            setCopyFeedback("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar acesso ao cliente</DialogTitle>
            <DialogDescription>
              Compartilhe o link de acompanhamento do projeto com o cliente via WhatsApp, e-mail ou cópia direta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome do cliente</label>
                <Input value={shareClientName} onChange={(e) => setShareClientName(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Telefone / WhatsApp</label>
                <Input
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value)}
                  placeholder="11999998888"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">E-mail do Cliente</label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="cliente@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prévia da mensagem</label>
              <Textarea value={shareMessage} readOnly className="min-h-[180px] resize-none font-mono text-xs" />
            </div>

            {copyFeedback ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {copyFeedback}
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleCopyLink}>
              Copiar Link de Acompanhamento
            </Button>
            <Button variant="secondary" onClick={handleSendWhatsApp}>
              Enviar via WhatsApp
            </Button>
            <Button onClick={handleSendEmail}>Enviar via E-mail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setTitle("");
            setDateLabel("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo marco de entrega</DialogTitle>
            <DialogDescription>
              O cliente verá este marco na linha do tempo do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do marco"
            />
            <Input
              value={dateLabel}
              onChange={(e) => setDateLabel(e.target.value)}
              placeholder="Previsão (ex.: Previsto para 30/Out)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!title.trim()}
              onClick={() => {
                onAddMilestone(title.trim(), dateLabel.trim() || "Sem data definida");
                setOpen(false);
                setTitle("");
                setDateLabel("");
              }}
            >
              Criar marco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
