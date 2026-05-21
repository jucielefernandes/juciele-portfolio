import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import ImageUploader from "./ImageUploader";
import type { Certificate } from "@/lib/types";

export default function AdminCertificatesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    date: "",
    imageUrl: "",
  });

  const certificatesQuery = trpc.certificates.list.useQuery();
  const createMutation = trpc.certificates.create.useMutation();
  const updateMutation = trpc.certificates.update.useMutation();
  const deleteMutation = trpc.certificates.delete.useMutation();

  const certificates = certificatesQuery.data || [];

  const handleOpenDialog = (cert?: Certificate) => {
    if (cert) {
      setEditingId(cert.id);
      setFormData({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        imageUrl: cert.imageUrl || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        issuer: "",
        date: "",
        imageUrl: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          issuer: formData.issuer,
          date: formData.date,
          imageUrl: formData.imageUrl || undefined,
        });
        toast.success("Certificado atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          issuer: formData.issuer,
          date: formData.date,
          imageUrl: formData.imageUrl || undefined,
        });
        toast.success("Certificado criado com sucesso!");
      }
      setIsOpen(false);
      certificatesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao salvar certificado");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este certificado?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Certificado deletado com sucesso!");
      certificatesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao deletar certificado");
    }
  };

  return (
    <div className="space-y-6">
      <Button onClick={() => handleOpenDialog()} className="gap-2">
        <Plus size={18} />
        Novo Certificado
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert: any) => (
          <Card key={cert.id} className="p-6">
            {cert.imageUrl && (
              <div className="w-full h-32 bg-muted rounded-lg mb-4 overflow-hidden">
                <img
                  src={cert.imageUrl}
                  alt={cert.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="text-lg font-bold mb-1">{cert.name}</h3>
            <p className="text-sm text-muted-foreground mb-1">{cert.issuer}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {new Date(cert.date).toLocaleDateString("pt-BR")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDialog(cert)}
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(cert.id)}
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
              {editingId ? "Editar Certificado" : "Novo Certificado"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Certificado</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Emissor</Label>
              <Input
                id="issuer"
                value={formData.issuer}
                onChange={(e) =>
                  setFormData({ ...formData, issuer: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data (YYYY-MM-DD)</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <ImageUploader
              value={formData.imageUrl}
              onChange={(url) =>
                setFormData({ ...formData, imageUrl: url })
              }
              label="Imagem do Certificado"
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
