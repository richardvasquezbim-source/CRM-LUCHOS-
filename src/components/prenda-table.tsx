"use client";

import { useMemo, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ESTADOS_FABRICACION, ESTADOS_PAGO } from "@/lib/estados";
import { calcularAlerta, formatFechaSoloDia } from "@/lib/alerta";
import {
  updateEstadoFabricacion,
  updateEstadoPago,
} from "@/app/prendas/actions";
import type { Prenda } from "@/components/prendas-view";
import type { EstadoFabricacionKey, EstadoPagoKey } from "@/lib/estados";
import { Trash2Icon } from "lucide-react";

function formatFecha(d: Date | null) {
  return formatFechaSoloDia(d) ?? "-";
}

function formatMonto(m: number | null) {
  if (m === null || m === undefined) return "-";
  return m.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const alertaClasses: Record<string, string> = {
  vencido: "bg-red-100 text-red-800 border-red-200",
  proximo: "bg-amber-100 text-amber-800 border-amber-200",
  ok: "bg-green-100 text-green-800 border-green-200",
};

function Fila({
  prenda,
  onEdit,
  onArchive,
}: {
  prenda: Prenda;
  onEdit: (prenda: Prenda) => void;
  onArchive: (prenda: Prenda) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const alerta = calcularAlerta(
    prenda.fechaEntregaSolicitada,
    prenda.estadoFabricacion
  );

  return (
    <tr className="border-b hover:bg-muted/50">
      <td
        className="cursor-pointer px-3 py-2 font-medium"
        onClick={() => onEdit(prenda)}
      >
        {prenda.clienteNombre}
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        {prenda.contacto || "-"}
      </td>
      <td className="cursor-pointer px-3 py-2" onClick={() => onEdit(prenda)}>
        {prenda.disenoTela}
      </td>
      <td className="px-3 py-2">{prenda.talla || "-"}</td>
      <td className="px-3 py-2">{prenda.tipoPrenda}</td>
      <td className="px-3 py-2">{prenda.proveedor.nombre}</td>
      <td className="px-3 py-2">
        <select
          value={prenda.estadoFabricacion}
          disabled={isPending}
          onChange={(e) => {
            const value = e.target.value as EstadoFabricacionKey;
            startTransition(() => {
              updateEstadoFabricacion(prenda.id, value);
            });
          }}
          className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs disabled:opacity-50"
        >
          {ESTADOS_FABRICACION.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={prenda.estadoPago}
          disabled={isPending}
          onChange={(e) => {
            const value = e.target.value as EstadoPagoKey;
            startTransition(() => {
              updateEstadoPago(prenda.id, value);
            });
          }}
          className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs disabled:opacity-50"
        >
          {ESTADOS_PAGO.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">{formatFecha(prenda.fechaEntregaSolicitada)}</td>
      <td className="px-3 py-2">
        {alerta ? (
          <Badge variant="outline" className={alertaClasses[alerta.nivel]}>
            {alerta.label}
          </Badge>
        ) : (
          "-"
        )}
      </td>
      <td className="px-3 py-2">{formatMonto(prenda.montoPagado)}</td>
      <td className="max-w-[160px] truncate px-3 py-2 text-muted-foreground italic">
        {prenda.nota || ""}
      </td>
      <td className="px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Archivar"
          onClick={() => onArchive(prenda)}
        >
          <Trash2Icon />
        </Button>
      </td>
    </tr>
  );
}

export function PrendaTable({
  prendas,
  onEdit,
  onArchive,
}: {
  prendas: Prenda[];
  onEdit: (prenda: Prenda) => void;
  onArchive: (prenda: Prenda) => void;
}) {
  const ordenadas = useMemo(() => {
    return [...prendas].sort((a, b) => {
      if (!a.fechaEntregaSolicitada && !b.fechaEntregaSolicitada) return 0;
      if (!a.fechaEntregaSolicitada) return 1;
      if (!b.fechaEntregaSolicitada) return -1;
      return (
        new Date(a.fechaEntregaSolicitada).getTime() -
        new Date(b.fechaEntregaSolicitada).getTime()
      );
    });
  }, [prendas]);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Cliente</th>
            <th className="px-3 py-2 font-medium">Contacto</th>
            <th className="px-3 py-2 font-medium">Diseño / Tela</th>
            <th className="px-3 py-2 font-medium">Talla</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Proveedor</th>
            <th className="px-3 py-2 font-medium">Fabricación</th>
            <th className="px-3 py-2 font-medium">Pago</th>
            <th className="px-3 py-2 font-medium">Entrega</th>
            <th className="px-3 py-2 font-medium">Alerta</th>
            <th className="px-3 py-2 font-medium">Monto</th>
            <th className="px-3 py-2 font-medium">Nota</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((p) => (
            <Fila key={p.id} prenda={p} onEdit={onEdit} onArchive={onArchive} />
          ))}
          {ordenadas.length === 0 && (
            <tr>
              <td colSpan={13} className="px-3 py-6 text-center text-muted-foreground">
                Sin prendas que coincidan con los filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
