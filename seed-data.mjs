import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Sample projects
const projects = [
  {
    title: "Sistema de Gestão de Tarefas",
    description: "Aplicação web para gerenciamento de tarefas com autenticação de usuários, categorização e priorização de tarefas. Desenvolvida com React, TypeScript e Node.js.",
    techTags: JSON.stringify(["React", "TypeScript", "Node.js", "MySQL"]),
    projectUrl: "https://github.com/jucielefernandes/task-manager",
    imageUrl: "/manus-storage/project-1.jpg",
  },
  {
    title: "API REST de E-commerce",
    description: "API robusta para plataforma de e-commerce com autenticação JWT, gerenciamento de produtos, carrinho de compras e processamento de pedidos.",
    techTags: JSON.stringify(["Node.js", "Express", "MongoDB", "JWT"]),
    projectUrl: "https://github.com/jucielefernandes/ecommerce-api",
    imageUrl: "/manus-storage/project-2.jpg",
  },
  {
    title: "Dashboard de Análise de Dados",
    description: "Dashboard interativo para visualização de dados em tempo real com gráficos dinâmicos, filtros avançados e exportação de relatórios em PDF.",
    techTags: JSON.stringify(["React", "Chart.js", "TypeScript", "Tailwind CSS"]),
    projectUrl: "https://github.com/jucielefernandes/analytics-dashboard",
    imageUrl: "/manus-storage/project-3.jpg",
  },
  {
    title: "Aplicação de Chat em Tempo Real",
    description: "Plataforma de chat com suporte a múltiplos usuários, notificações em tempo real, histórico de mensagens e autenticação segura.",
    techTags: JSON.stringify(["React", "Socket.io", "Node.js", "PostgreSQL"]),
    projectUrl: "https://github.com/jucielefernandes/realtime-chat",
    imageUrl: "/manus-storage/project-4.jpg",
  },
];

// Sample certificates
const certificates = [
  {
    name: "Certificado em Full-Stack Development",
    issuer: "Alura",
    date: "2024-06-15",
    imageUrl: "/manus-storage/cert-1.jpg",
  },
  {
    name: "Certificado em React Avançado",
    issuer: "Udemy",
    date: "2024-05-20",
    imageUrl: "/manus-storage/cert-2.jpg",
  },
  {
    name: "Certificado em Node.js e Express",
    issuer: "Coursera",
    date: "2024-04-10",
    imageUrl: "/manus-storage/cert-3.jpg",
  },
  {
    name: "Certificado em TypeScript Profissional",
    issuer: "LinkedIn Learning",
    date: "2024-03-05",
    imageUrl: "/manus-storage/cert-4.jpg",
  },
];

try {
  console.log("Inserindo projetos de exemplo...");
  for (const project of projects) {
    await connection.execute(
      "INSERT INTO projects (title, description, techTags, projectUrl, imageUrl) VALUES (?, ?, ?, ?, ?)",
      [
        project.title,
        project.description,
        project.techTags,
        project.projectUrl,
        project.imageUrl,
      ]
    );
  }
  console.log(`✓ ${projects.length} projetos inseridos`);

  console.log("Inserindo certificados de exemplo...");
  for (const cert of certificates) {
    await connection.execute(
      "INSERT INTO certificates (name, issuer, date, imageUrl) VALUES (?, ?, ?, ?)",
      [cert.name, cert.issuer, cert.date, cert.imageUrl]
    );
  }
  console.log(`✓ ${certificates.length} certificados inseridos`);

  console.log("\n✅ Dados de exemplo inseridos com sucesso!");
} catch (error) {
  console.error("❌ Erro ao inserir dados:", error);
} finally {
  await connection.end();
}
