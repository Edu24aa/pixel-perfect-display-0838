import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditEntry.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const project = await prisma.project.create({
    data: {
      name: "Migração de Gateway de Pagamento v2",
      client: "Nordeste Varejo S.A.",
      dueLabel: "24 de Outubro",
      overallStatus: "Em Homologação",
      accessCode: "NF-2024-001",
      milestones: {
        create: [
          {
            title: "Alinhamento e Arquitetura",
            status: "approved",
            dateLabel: "Concluído em 10/Out",
            summary: "Definimos o escopo, os fluxos de pagamento e a arquitetura da integração junto ao seu time financeiro.",
            order: 1,
          },
          {
            title: "Desenvolvimento de APIs e Integração Bancária",
            status: "approved",
            dateLabel: "Concluído em 18/Out",
            summary: "Conectamos o sistema ao banco parceiro e validamos transações de teste ponta a ponta.",
            order: 2,
          },
          {
            title: "Homologação do Fluxo de Checkout",
            status: "review",
            dateLabel: "Aguardando sua aprovação",
            summary: "Implementamos a tela de checkout com validação de cartão e suporte a Pix.",
            demoUrl: "https://checkout-homolog.exemplo.com",
            order: 3,
          },
          {
            title: "Publicação em Produção e Monitoramento",
            status: "pending",
            dateLabel: "Previsto para 24/Out",
            summary: "Subida controlada em produção, acompanhamento das primeiras transações reais e relatório final.",
            order: 4,
          },
        ],
      },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "admin@clientlens.com" },
    update: {},
    create: {
      email: "admin@clientlens.com",
      password: "admin123",
      name: "Gestor TI",
      role: "MANAGER",
    },
  });

  await prisma.auditEntry.createMany({
    data: [
      {
        text: "Nordeste Varejo aprovou a etapa “Desenvolvimento de APIs e Integração Bancária”",
        timestamp: "18/Out às 14:32",
        read: false,
      },
      {
        text: "Nordeste Varejo aprovou a etapa “Alinhamento e Arquitetura”",
        timestamp: "10/Out às 09:15",
        read: false,
      },
      {
        text: "Equipe de TI marcou “Homologação do Fluxo de Checkout” como pronto para homologação",
        timestamp: "19/Out às 17:04",
        read: false,
      },
      {
        text: "Cliente Nordeste Varejo S.A. sugeriu um ajuste na etapa “Homologação do Fluxo de Checkout”",
        timestamp: "Hoje às 10:12",
        read: false,
      },
    ],
  });

  console.log("Banco populado com sucesso para o projeto:", project.name);
  console.log("Gestor padrão criado:", manager.email, "role=", manager.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
