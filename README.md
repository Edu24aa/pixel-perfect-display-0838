# 🔍 ClientLens

> Plataforma inteligente para gestão, transparência e rastreamento de ordens de serviço e projetos em tempo real, com assistente virtual integrado com IA.

🔗 **Acesse o projeto online:** [pixel-perfect-display-0838.vercel.app](https://pixel-perfect-display-0838.vercel.app)

---

## 📌 Sobre o Projeto

O **ClientLens** foi desenvolvido para solucionar a falta de visibilidade e comunicação entre prestadores de serviço e clientes. A plataforma centraliza o acompanhamento de demandas e ordens de serviço em um único painel, permitindo que clientes monitorem o progresso em tempo real e tirem dúvidas instantaneamente através de um assistente de IA focado no ecossistema do sistema.

---

## ✨ Funcionalidades

- **Gestão de Ordens de Serviço & Projetos:** Criação, edição e controle de status das demandas.
- **Visão do Cliente (ClientView):** Área dedicada para acompanhamento transparente do progresso e etapas concluídas.
- **Assistente Virtual Inteligente (IA):**
  - Integração com a API do **Google Gemini** (`@google/genai`).
  - *Guardrails* rigorosos via *System Instructions* para responder estritamente sobre a plataforma e o status dos projetos.
- **Interface Moderna & Responsiva:** Design otimizado para desktop e dispositivos móveis.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React** com **Vite**
- **TypeScript**
- **Tailwind CSS** / **Lucide Icons**
- Deploy: **Vercel**

### Backend
- **Node.js** com **Express**
- **TypeScript**
- **Prisma ORM**
- Deploy: **Render**

### Banco de Dados & IA
- **Neon Serverless PostgreSQL**
- **Google Gemini API** (`gemini-2.5-flash`)

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js (v18+) instalado
- Conta no [Neon](https://neon.tech/) (PostgreSQL)
- Chave de API do [Google AI Studio](https://aistudio.google.com/)

### 1. Clonar o Repositório
```bash
git clone [https://github.com/Edu24aa/pixel-perfect-display-0838.git](https://github.com/Edu24aa/pixel-perfect-display-0838.git)
cd pixel-perfect-display-0838

2. Configurar Variáveis de Ambiente
Crie um arquivo .env na pasta do servidor (server/.env) com as seguintes chaves:

Snippet de código
DATABASE_URL="postgresql://usuario:senha@host/neondb?sslmode=require"
GEMINI_API_KEY="sua_chave_do_gemini_aqui"
PORT=3333

3. Instalar Dependências e Iniciar
Backend:
Bash
cd server
npm install
npx prisma generate
npm run dev

Frontend:
Em outro terminal:
Bash
cd client # ou na raiz caso seus componentes estejam na raiz
npm install
npm run dev

👨‍💻 Autor
Desenvolvido por Eduardo Augusto.

Feedbacks e sugestões são muito bem-vindos!


---

### Como salvar e subir a atualização do README:

1. Abra o arquivo `README.md` no seu editor (VS Code).
2. Substitua o conteúdo pelo modelo acima e salve (`Ctrl + S`).
3. No terminal:
```bash
git add README.md
git commit -m "docs: atualiza documentacao do README com detalhes do ClientLens"
git push origin main