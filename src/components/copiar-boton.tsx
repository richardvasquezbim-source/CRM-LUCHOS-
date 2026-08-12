"use client";

import { Button } from "@/components/ui/button";
import { ClipboardCopyIcon } from "lucide-react";
import { toast } from "sonner";

export function CopiarBoton({
  texto,
  label,
  variant = "outline",
  size = "sm",
}: {
  texto: string;
  label: string;
  variant?: "default" | "outline";
  size?: "sm" | "default";
}) {
  function copiar() {
    navigator.clipboard.writeText(texto).then(
      () => toast.success("Copiado. Pégalo en tu hoja de Sheets/Excel."),
      () => toast.error("No se pudo copiar")
    );
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={copiar}>
      <ClipboardCopyIcon /> {label}
    </Button>
  );
}
