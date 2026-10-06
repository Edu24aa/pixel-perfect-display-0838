import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditEntry.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();

  const project = await prisma.project.create({
    data: {
      name: "Migração de Gateway de Pagamento v2",
      client: "Nordeste Varejo S.A.",
      dueLabel: "24 de Outubro",
      overallStatus: "Em Homologação",
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

  await prisma.auditEntry.createMany({
    data: [
      {
        text: "Nordeste Varejo aprovou a etapa “Desenvolvimento de APIs e Integração Bancária”",
        timestamp: "18/Out às 14:32",
      },
      {
        text: "Nordeste Varejo aprovou a etapa “Alinhamento e Arquitetura”",
        timestamp: "10/Out às 09:15",
      },
      {
        text: "Equipe de TI marcou “Homologação do Fluxo de Checkout” como pronto para homologação",
        timestamp: "19/Out às 17:04",
      },
    ],
  });

  console.log("Banco populado com sucesso para o projeto:", project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
