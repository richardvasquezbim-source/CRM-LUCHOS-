"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generarPedidoEricka } from "@/app/pedidos-ericka/actions";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

export function GenerarPedidoBoton({
  telaId,
  label,
  variant = "outline",
  confirmar = false,
}: {
  telaId: string;
  label: string;
  variant?: "default" | "outline";
  confirmar?: boolean;
}) {
  const [pending, start] = useTransition();

  function handle() {
    if (
      confirmar &&
      !confirm("Se reemplazará la tabla actual con una nueva propuesta. ¿Continuar?")
    ) {
      return;
    }
    start(async () => {
      await generarPedidoEricka(telaId);
      toast.success("Pedido generado");
    });
  }

  return (
    <Button type="button" variant={variant} size="sm" disabled={pending} onClick={handle}>
      <RefreshCwIcon /> {label}
    </Button>
  );
}
