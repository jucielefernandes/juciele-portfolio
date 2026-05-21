import { useEffect, useState } from "react";
import { ExternalLink, Github, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Repository {
  id: number;
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
}

export default function GitHubRepositories() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://api.github.com/users/jucielefernandes/repos?sort=stars&order=desc&per_page=12"
        );

        if (!response.ok) {
          throw new Error("Falha ao buscar repositórios do GitHub");
        }

        const data = await response.json();

        const formattedRepos: Repository[] = data.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        }));

        setRepos(formattedRepos);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar repositórios"
        );
        setRepos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2" size={24} />
        <p className="text-muted-foreground">Carregando repositórios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="mr-2 text-destructive" size={24} />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum repositório encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {repos.map((repo) => (
        <Card key={repo.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground flex-1">
              {repo.name}
            </h3>
            <Github size={20} className="text-muted-foreground flex-shrink-0" />
          </div>

          {repo.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {repo.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {repo.language && (
              <Badge variant="secondary" className="text-xs">
                {repo.language}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span>⭐ {repo.stars}</span>
            <span>🍴 {repo.forks}</span>
          </div>

          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent hover:underline font-semibold text-sm"
          >
            Ver Repositório
            <ExternalLink size={14} />
          </a>
        </Card>
      ))}
    </div>
  );
}
