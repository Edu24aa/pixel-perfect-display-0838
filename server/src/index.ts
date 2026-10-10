import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

const normalizeRole = (role: string) => {
  const value = String(role ?? '').trim().toUpperCase();
  if (value === 'GESTOR') return 'MANAGER';
  if (value === 'CONSULTOR') return 'CONSULTANT';
  return value;
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || user.password !== String(password)) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { milestones: { orderBy: { order: 'asc' } } },
    });

    return res.json(projects);
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

const generateAccessCode = async () => {
  const latestProject = await prisma.project.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { accessCode: true },
  });

  const fallback = 'NF-2024-001';
  if (!latestProject?.accessCode) return fallback;

  const match = latestProject.accessCode.match(/^(NF-\d{4}-)(\d+)$/i);
  if (!match) return fallback;

  const sequence = Number(match[2] ?? 1) + 1;
  return `${match[1]}${String(sequence).padStart(3, '0')}`;
};

app.post('/api/projects', async (req, res) => {
  const {
    name,
    clientName,
    client,
    clientEmail,
    clientPhone,
    accessCode,
    dueLabel,
    overallStatus,
    milestones,
  } = req.body ?? {};

  const normalizedName = String(name ?? '').trim();
  const normalizedClient = String(clientName ?? client ?? '').trim();

  if (!normalizedName || !normalizedClient) {
    return res.status(400).json({ error: 'Nome do projeto e nome do cliente são obrigatórios' });
  }

  try {
    const finalAccessCode = String(accessCode ?? '').trim() || (await generateAccessCode());

    const existingProject = await prisma.project.findUnique({
      where: { accessCode: finalAccessCode },
    });

    if (existingProject) {
      return res.status(409).json({ error: 'Código de acesso já cadastrado para outro projeto' });
    }

    const defaultMilestones = [
      { title: 'Briefing e escopo', summary: 'Revisão do escopo e objetivos do projeto', dateLabel: 'A definir', status: 'pending', order: 0 },
      { title: 'Arquitetura e construção', summary: 'Implementação da solução e revisão de entregas', dateLabel: 'A definir', status: 'pending', order: 1 },
      { title: 'Homologação final', summary: 'Validação final e aprovação do cliente', dateLabel: 'A definir', status: 'pending', order: 2 },
    ];

    const projectMilestones = Array.isArray(milestones) && milestones.length > 0
      ? milestones.map((milestone, index) => ({
          title: String(milestone?.title ?? '').trim(),
          summary: String(milestone?.summary ?? milestone?.title ?? '').trim(),
          dateLabel: String(milestone?.dateLabel ?? 'A definir').trim() || 'A definir',
          status: String(milestone?.status ?? 'pending').trim() || 'pending',
          order: Number(milestone?.orderIndex ?? index) || index,
        }))
      : defaultMilestones;

    const createdProject = await prisma.project.create({
      data: {
        name: normalizedName,
        client: normalizedClient,
        clientEmail: clientEmail ? String(clientEmail).trim() || null : null,
        clientPhone: clientPhone ? String(clientPhone).trim() || null : null,
        accessCode: finalAccessCode,
        dueLabel: String(dueLabel ?? 'Sem data definida').trim() || 'Sem data definida',
        overallStatus: String(overallStatus ?? 'Em Homologação').trim() || 'Em Homologação',
        milestones: {
          create: projectMilestones
            .filter((milestone) => milestone.title)
            .map((milestone) => ({
              title: milestone.title,
              summary: milestone.summary,
              dateLabel: milestone.dateLabel,
              status: milestone.status,
              order: milestone.order,
            })),
        },
      },
      include: { milestones: { orderBy: { order: 'asc' } } },
    });

    return res.status(201).json(createdProject);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return res.status(500).json({ error: 'Falha ao cadastrar projeto' });
  }
});

app.get('/api/project', async (_req, res) => {
  try {
    const project = await prisma.project.findFirst({
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const auditLog = await prisma.auditEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    return res.json({ project, auditLog });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { milestones: { orderBy: { order: 'asc' } } },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const auditLog = await prisma.auditEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ project, auditLog });
  } catch (error) {
    console.error('Erro ao buscar projeto por id:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, client, clientEmail, clientPhone, dueLabel, overallStatus, accessCode } = req.body ?? {};

  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(client !== undefined && { client: String(client).trim() }),
        ...(clientEmail !== undefined && { clientEmail: String(clientEmail).trim() || null }),
        ...(clientPhone !== undefined && { clientPhone: String(clientPhone).trim() || null }),
        ...(dueLabel !== undefined && { dueLabel: String(dueLabel).trim() }),
        ...(overallStatus !== undefined && { overallStatus: String(overallStatus).trim() }),
        ...(accessCode !== undefined && { accessCode: String(accessCode).trim() }),
      },
    });

    return res.json(updatedProject);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    return res.status(500).json({ error: 'Falha ao atualizar projeto' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.project.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    return res.status(500).json({ error: 'Falha ao excluir projeto' });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role = 'MANAGER' } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
  }

  const normalizedRole = normalizeRole(role);
  const allowedRoles = new Set(['MANAGER', 'ADMIN', 'CONSULTANT']);

  if (!allowedRoles.has(normalizedRole)) {
    return res.status(400).json({ error: 'Perfil inválido' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const createdUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: String(password),
        role: normalizedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json(createdUser);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body ?? {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role: normalizeRole(role ?? 'MANAGER'),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Falha ao atualizar usuário' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Falha ao excluir usuário' });
  }
});

app.get('/api/project/track/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { accessCode: String(code).trim() },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto ou Nota Fiscal não encontrada' });
    }

    const auditLog = await prisma.auditEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ project, auditLog });
  } catch (error) {
    console.error('Erro ao buscar projeto por código:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/client/profile', async (req, res) => {
  const { code, projectId, name, email, phone } = req.body ?? {};

  if (!code && !projectId) {
    return res.status(400).json({ error: 'Código do projeto ou id do cliente obrigatório' });
  }

  try {
    const project = await prisma.project.findFirst({
      where: code ? { accessCode: String(code).trim() } : { id: String(projectId) },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado para atualização do perfil' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(name !== undefined && { client: String(name).trim() || project.client }),
        ...(email !== undefined && { clientEmail: String(email).trim() || null }),
        ...(phone !== undefined && { clientPhone: String(phone).trim() || null }),
      },
    });

    return res.json(updatedProject);
  } catch (error) {
    console.error('Erro ao atualizar perfil do cliente:', error);
    return res.status(500).json({ error: 'Falha ao atualizar perfil do cliente' });
  }
});

app.get('/api/notifications', async (_req, res) => {
  try {
    const notifications = await prisma.auditEntry.findMany({
      where: { read: false },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(notifications);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.auditEntry.update({
      where: { id },
      data: { read: true },
    });

    return res.json(notification);
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return res.status(500).json({ error: 'Falha ao atualizar notificação' });
  }
});

app.post('/api/milestones', async (req, res) => {
  const { projectId, title, description, dueDate, status = 'pending', orderIndex = 0 } = req.body ?? {};

  if (!projectId || !title) {
    return res.status(400).json({ error: 'Projeto e título do marco são obrigatórios' });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: String(projectId) } });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const createdMilestone = await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: String(title).trim(),
        summary: String(description ?? '').trim() || String(title).trim(),
        dateLabel: String(dueDate ?? 'Sem data definida').trim() || 'Sem data definida',
        status: String(status).trim() || 'pending',
        order: Number(orderIndex) || 0,
      },
    });

    return res.status(201).json(createdMilestone);
  } catch (error) {
    console.error('Erro ao criar marco:', error);
    return res.status(500).json({ error: 'Falha ao criar marco' });
  }
});

app.put('/api/milestones/:id', async (req, res) => {
  const { id } = req.params;
  const { projectId, title, description, dueDate, status, orderIndex } = req.body ?? {};

  try {
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(projectId !== undefined && { projectId: String(projectId) }),
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { summary: String(description).trim() }),
        ...(dueDate !== undefined && { dateLabel: String(dueDate).trim() }),
        ...(status !== undefined && { status: String(status).trim() }),
        ...(orderIndex !== undefined && { order: Number(orderIndex) || 0 }),
      },
    });

    return res.json(updatedMilestone);
  } catch (error) {
    console.error('Erro ao atualizar marco:', error);
    return res.status(500).json({ error: 'Falha ao atualizar marco' });
  }
});

app.delete('/api/milestones/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.milestone.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir marco:', error);
    return res.status(500).json({ error: 'Falha ao excluir marco' });
  }
});

app.patch('/api/milestones/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { clientName = 'Cliente' } = req.body;

  try {
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: {
        status: 'approved',
        dateLabel: 'Aprovado formalmente',
      },
    });

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    await prisma.auditEntry.create({
      data: {
        text: `${clientName} homologou a etapa “${updatedMilestone.title}”`,
        timestamp: formattedDate,
      },
    });

    return res.json(updatedMilestone);
  } catch (error) {
    console.error('Erro ao aprovar marco:', error);
    return res.status(500).json({ error: 'Falha ao homologar etapa' });
  }
});

app.patch('/api/milestones/:id/request-change', async (req, res) => {
  const { id } = req.params;
  const { reason = 'Ajustes solicitados', clientName = 'Cliente' } = req.body;

  try {
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: {
        status: 'in_progress',
        dateLabel: 'Em revisão e ajustes',
      },
    });

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    await prisma.auditEntry.create({
      data: {
        text: `Cliente ${clientName} sugeriu um ajuste em “${updatedMilestone.title}”: ${reason}`,
        timestamp: formattedDate,
        read: false,
      },
    });

    return res.json(updatedMilestone);
  } catch (error) {
    console.error('Erro ao solicitar ajuste:', error);
    return res.status(500).json({ error: 'Falha ao solicitar ajuste' });
  }
});

app.patch('/api/milestones/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, dateLabel } = req.body;

  try {
    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status,
        ...(dateLabel && { dateLabel }),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    return res.status(500).json({ error: 'Falha ao atualizar status' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ClientLens rodando em http://0.0.0.0:${PORT}`);
});
