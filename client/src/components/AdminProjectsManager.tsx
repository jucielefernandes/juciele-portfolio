import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import ImageUploader from "./ImageUploader";
import type { Project } from "@/lib/types";

function parseTags(techTags: string | null | undefined): string {
  if (!techTags) return "";
  try {
    const parsed = JSON.parse(techTags);
    return Array.isArray(parsed) ? parsed.map(String).join(", ") : "";
  } catch {
    return "";
  }
}

export default function AdminProjectsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techTags: "",
    projectUrl: "",
    imageUrl: "",
  });

  const projectsQuery = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation();
  const updateMutation = trpc.projects.update.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();

  const projects = projectsQuery.data || [];

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        title: project.title,
        description: project.description,
        techTags: project.techTags ? parseTags(project.techTags) : "",
        projectUrl: project.projectUrl || "",
        imageUrl: project.imageUrl || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        techTags: "",
        projectUrl: "",
        imageUrl: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const techTagsArray = formData.techTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: formData.title,
          description: formData.description,
          techTags: techTagsArray,
          projectUrl: formData.projectUrl || undefined,
          imageUrl: formData.imageUrl || undefined,
        });
        toast.success("Projeto atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          description: formData.description,
          techTags: techTagsArray,
          projectUrl: formData.projectUrl || undefined,
          imageUrl: formData.imageUrl || undefined,
        });
        toast.success("Projeto criado com sucesso!");
      }
      setIsOpen(false);
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao salvar projeto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este projeto?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Projeto deletado com sucesso!");
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar projeto");
    }
  };

  return (
    <div className="space-y-6">
      <Button onClick={() => handleOpenDialog()} className="gap-2">
        <Plus size={18} />
        Novo Projeto
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project: any) => (
          <Card key={project.id} className="p-6">
            {project.imageUrl && (
              <div className="w-full h-32 bg-muted rounded-lg mb-4 overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="text-lg font-bold mb-2">{project.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDialog(project)}
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(project.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="techTags">
                Tags de Tecnologia (separadas por vírgula)
              </Label>
              <Input
                id="techTags"
                value={formData.techTags}
                onChange={(e) =>
                  setFormData({ ...formData, techTags: e.target.value })
                }
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectUrl">URL do Projeto</Label>
              <Input
                id="projectUrl"
                type="url"
                value={formData.projectUrl}
                onChange={(e) =>
                  setFormData({ ...formData, projectUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <ImageUploader
              value={formData.imageUrl}
              onChange={(url) =>
                setFormData({ ...formData, imageUrl: url })
              }
              label="Imagem do Projeto"
              placeholder="Cole a URL da imagem ou faça upload"
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
