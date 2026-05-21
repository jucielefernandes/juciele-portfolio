import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LogOut, AlertCircle } from "lucide-react";
import ProjectsManager from "@/components/AdminProjectsManager";
import CertificatesManager from "@/components/AdminCertificatesManager";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const sessionQuery = trpc.admin.checkSession.useQuery();
  const logoutMutation = trpc.admin.logout.useMutation();

  useEffect(() => {
    console.log("[AdminDashboard] Session query state:", {
      isLoading: sessionQuery.isLoading,
      isAuthenticated: sessionQuery.data?.isAuthenticated,
      isError: sessionQuery.isError,
    });

    if (
      !sessionQuery.isLoading &&
      !sessionQuery.data?.isAuthenticated &&
      !isRedirecting
    ) {
      console.log("[AdminDashboard] Usuário não autenticado, redirecionando para login");
      setIsRedirecting(true);
      setLocation("/admin");
    }
  }, [
    sessionQuery.isLoading,
    sessionQuery.data?.isAuthenticated,
    isRedirecting,
    setLocation,
  ]);

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4 font-semibold">
            Erro ao verificar sessão
          </p>
          <p className="text-muted-foreground mb-6">
            Houve um problema ao verificar sua autenticação. Tente novamente.
          </p>
          <Button onClick={() => sessionQuery.refetch()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionQuery.data?.isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      console.log("[AdminDashboard] Iniciando logout");
      await logoutMutation.mutateAsync();
      toast.success("Logout realizado com sucesso!");
      setLocation("/");
    } catch (error) {
      console.error("[AdminDashboard] Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">
              Gerencie seus projetos e certificados
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut size={18} className="mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <ProjectsManager />
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <CertificatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
