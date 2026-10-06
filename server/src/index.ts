import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

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
