import { useState } from "react";
import { Link } from "wouter";
import { Github, Linkedin, Mail, ExternalLink, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import GitHubRepositories from "@/pages/GitHubRepositories";

const TECH_STACK = [
  { name: "Java", color: "bg-orange-100 text-orange-800" },
  { name: "JavaScript", color: "bg-yellow-100 text-yellow-800" },
  { name: "React", color: "bg-blue-100 text-blue-800" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-800" },
  { name: "Node.js", color: "bg-green-100 text-green-800" },
  { name: "SQL", color: "bg-purple-100 text-purple-800" },
];

function parseTags(techTags: string | null | undefined): string[] {
  if (!techTags) return [];
  try {
    const parsed = JSON.parse(techTags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"projects" | "certificates">(
    "projects"
  );

  const projectsQuery = trpc.projects.list.useQuery();
  const certificatesQuery = trpc.certificates.list.useQuery();

  const projects = projectsQuery.data || [];
  const certificates = certificatesQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-accent">JF</div>
          <div className="flex items-center gap-8">
            <a
              href="#projects"
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Projetos
            </a>
            <a
              href="#certificates"
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Certificados
            </a>
            <a
              href="#github"
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              GitHub
            </a>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Olá, sou <span className="text-accent">Juciele</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Desenvolvedora Full-Stack apaixonada por criar soluções elegantes
              e eficientes.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Atualmente trabalhando como <span className="font-semibold">Associate Full-Stack Developer</span> na <span className="font-semibold text-accent">Avanade</span>. Cursando Análise e Desenvolvimento de Sistemas.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4 mb-8">
              <a
                href="https://www.linkedin.com/in/jucielefernandes/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn de Juciele Fernandes"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://github.com/jucielefernandes"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub de Juciele Fernandes"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:juciele.bol@gmail.com"
                aria-label="Enviar e-mail para Juciele Fernandes"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <Mail size={20} />
              </a>
            </div>

            {/* Tech Stack */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4">
                Tecnologias
              </p>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map((tech) => (
                  <Badge key={tech.name} className={tech.color}>
                    {tech.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Image Placeholder */}
          <div className="flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-border flex items-center justify-center">
              <Code2 size={80} className="text-accent/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Projects & Certificates Section */}
      <section className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="flex gap-4 mb-12 border-b border-border">
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === "projects"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Projetos ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab("certificates")}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === "certificates"
                  ? "text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Certificados ({certificates.length})
            </button>
          </div>

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div id="projects" className="space-y-6">
              {projectsQuery.isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando projetos...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum projeto adicionado ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project: any) => (
                    <Card
                      key={project.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {project.imageUrl && (
                        <div className="w-full h-48 bg-muted overflow-hidden">
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">
                          {project.title}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {project.description}
                        </p>
                        {project.techTags && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {parseTags(project.techTags).map(
                              (tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                        {isSafeUrl(project.projectUrl) && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                          >
                            Ver Projeto
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === "certificates" && (
            <div id="certificates" className="space-y-6">
              {certificatesQuery.isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando certificados...
                </div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum certificado adicionado ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert: any) => (
                    <Card
                      key={cert.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {cert.imageUrl && (
                        <div className="w-full h-48 bg-muted overflow-hidden">
                          <img
                            src={cert.imageUrl}
                            alt={cert.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{cert.name}</h3>
                        <p className="text-muted-foreground mb-2">
                          {cert.issuer}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {new Date(cert.date).toLocaleDateString("pt-BR")}
                        </p>
                        {isSafeUrl(cert.certificateUrl) && (
                          <a
                            href={cert.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                          >
                            Ver certificado
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* GitHub Repositories Section */}
      <section id="github" className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">Repositórios GitHub</h2>
          <GitHubRepositories />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>
            © 2026 Juciele Fernandes. Desenvolvido com React, TypeScript e
            Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
