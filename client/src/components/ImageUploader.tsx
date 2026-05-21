import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = "Imagem",
  placeholder = "Cole a URL da imagem ou faça upload",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.upload.uploadImage.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB");
      return;
    }

    setIsLoading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setPreview(dataUrl);

        // Extract base64 from data URL
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          toast.error("Erro ao processar imagem");
          setIsLoading(false);
          return;
        }

        try {
          // Upload to storage
          const result = await uploadMutation.mutateAsync({
            base64,
            filename: `${Date.now()}-${file.name}`,
            mimeType: file.type,
          });

          onChange(result.url);
          toast.success("Imagem enviada com sucesso!");
        } catch (error) {
          toast.error("Erro ao fazer upload da imagem");
          setPreview(null);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar imagem");
      setIsLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    if (url) {
      setPreview(url);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="space-y-3">
        {/* URL Input */}
        <div>
          <Input
            type="url"
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="text-sm"
            disabled={isLoading || uploadMutation.isPending}
          />
        </div>

        {/* File Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading || uploadMutation.isPending}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploadMutation.isPending}
            className="w-full gap-2"
          >
            {isLoading || uploadMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload size={16} />
                Fazer Upload
              </>
            )}
          </Button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden border border-border">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleClear}
              disabled={isLoading || uploadMutation.isPending}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
