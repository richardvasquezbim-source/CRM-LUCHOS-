"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatFechaSoloDia } from "@/lib/alerta";
import { restaurarPrenda } from "@/app/prendas/actions";
import type { Prenda } from "@/components/prendas-view";
import { RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

function Fila({ prenda }: { prenda: Prenda }) {
  const [isPending, startTransition] = useTransition();

  function handleRestaurar() {
    startTransition(async () => {
      await restaurarPrenda(prenda.id);
      toast.success("Prenda restaurada");
    });
  }

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="px-3 py-2 font-medium">{prenda.clienteNombre}</td>
      <td className="px-3 py-2">{prenda.disenoTela}</td>
      <td className="px-3 py-2">{prenda.proveedor.nombre}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {formatFechaSoloDia(prenda.archivedAt) ?? "-"}
      </td>
      <td className="px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleRestaurar}
        >
          <RotateCcwIcon /> Restaurar
        </Button>
      </td>
    </tr>
  );
}

export function PapeleraTable({ prendas }: { prendas: Prenda[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Cliente</th>
            <th className="px-3 py-2 font-medium">Diseño / Tela</th>
            <th className="px-3 py-2 font-medium">Proveedor</th>
            <th className="px-3 py-2 font-medium">Archivada</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {prendas.map((p) => (
            <Fila key={p.id} prenda={p} />
          ))}
          {prendas.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                La papelera está vacía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
