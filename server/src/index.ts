import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

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

// 1. Obter o projeto ativo com todos os marcos e histórico de auditoria
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

  const normalizedRole = String(role).trim().toUpperCase();
  const allowedRoles = new Set(['MANAGER', 'GESTOR', 'ADMIN', 'CONSULTANT', 'CONSULTOR']);

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
        role: normalizedRole === 'GESTOR' ? 'MANAGER' : normalizedRole === 'CONSULTOR' ? 'CONSULTANT' : normalizedRole,
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

// 1.1. Consultar projeto por código/NF sem login
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

// 2. Homologar/Aprovar um marco (Milestone)
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

    // Registrar no log de auditoria
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

// 3. Solicitar ajuste / Reprovar marco
app.patch('/api/milestones/:id/request-change', async (req, res) => {
  const { id } = req.params;
  const { reason = 'Ajustes solicitados' } = req.body;

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
        text: `Ajuste solicitado em “${updatedMilestone.title}”: ${reason}`,
        timestamp: formattedDate,
      },
    });

    return res.json(updatedMilestone);
  } catch (error) {
    console.error('Erro ao solicitar ajuste:', error);
    return res.status(500).json({ error: 'Falha ao solicitar ajuste' });
  }
});

// 4. Alternar status (Visão TI/Dev)
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor ClientLens rodando em http://localhost:${PORT}`);
});
