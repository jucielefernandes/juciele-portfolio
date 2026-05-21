import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.admin.login.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("[AdminLogin] Iniciando login com email:", email);
      
      const result = await loginMutation.mutateAsync({ email, password });
      console.log("[AdminLogin] Login bem-sucedido:", result);
      
      toast.success("Login realizado com sucesso!");
      
      // Aguardar um pouco para garantir que o cookie foi salvo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("[AdminLogin] Navegando para dashboard");
      setLocation("/admin/dashboard");
    } catch (error: any) {
      console.error("[AdminLogin] Erro ao fazer login:", error);
      const errorMsg = error?.message || "Email ou senha inválidos";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
              <Lock size={24} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Área Administrativa
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Faça login para gerenciar seu portfólio
          </p>

          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
              <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
