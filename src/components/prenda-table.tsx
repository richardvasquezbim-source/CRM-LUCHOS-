"use client";

import { useMemo, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ESTADOS_FABRICACION,
  ESTADOS_PAGO,
  getEstadoFabricacion,
  getEstadoPago,
} from "@/lib/estados";
import { calcularAlerta, formatFechaSoloDia } from "@/lib/alerta";
import {
  updateEstadoFabricacion,
  updateEstadoPago,
} from "@/app/prendas/actions";
import type { Prenda } from "@/components/prendas-view";
import type { EstadoFabricacionKey, EstadoPagoKey } from "@/lib/estados";
import { CopyIcon, PencilIcon, Trash2Icon } from "lucide-react";

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
  onView,
  onEdit,
  onDuplicate,
  onArchive,
}: {
  prenda: Prenda;
  onView: (prenda: Prenda) => void;
  onEdit: (prenda: Prenda) => void;
  onDuplicate: (prenda: Prenda) => void;
  onArchive: (prenda: Prenda) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const alerta = calcularAlerta(
    prenda.fechaEntregaSolicitada,
    prenda.estadoFabricacion
  );

  return (
    // Toda la fila abre el detalle; los controles interactivos de dentro
    // detienen la propagación para no abrirlo sin querer.
    <tr
      className="group cursor-pointer border-b hover:bg-muted/50"
      onClick={() => onView(prenda)}
    >
      <td className="px-3 py-2 font-medium">{prenda.clienteNombre}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {prenda.contacto || "-"}
      </td>
      <td className="px-3 py-2">{prenda.disenoTela}</td>
      <td className="px-3 py-2">{prenda.talla || "-"}</td>
      <td className="px-3 py-2">{prenda.tipoPrenda}</td>
      <td className="px-3 py-2">{prenda.proveedor.nombre}</td>
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
      {/* Columna fija a la derecha: la tabla es ancha y scrollea en horizontal,
          así las acciones quedan siempre a la vista. */}
      <td
        className="sticky right-0 z-10 border-l bg-background px-3 py-2 group-hover:bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Editar"
            onClick={() => onEdit(prenda)}
          >
            <PencilIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Duplicar"
            onClick={() => onDuplicate(prenda)}
          >
            <CopyIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Archivar"
            onClick={() => onArchive(prenda)}
          >
            <Trash2Icon />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function FilaCard({
  prenda,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
}: {
  prenda: Prenda;
  onView: (prenda: Prenda) => void;
  onEdit: (prenda: Prenda) => void;
  onDuplicate: (prenda: Prenda) => void;
  onArchive: (prenda: Prenda) => void;
}) {
  const alerta = calcularAlerta(
    prenda.fechaEntregaSolicitada,
    prenda.estadoFabricacion
  );
  const estadoFabricacion = getEstadoFabricacion(prenda.estadoFabricacion);
  const estadoPago = getEstadoPago(prenda.estadoPago);
  const envio = prenda.fechaEnvioReal
    ? formatFechaSoloDia(prenda.fechaEnvioReal)
    : "Pendiente";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(prenda)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(prenda);
        }
      }}
      className="cursor-pointer rounded-xl border bg-card p-3 text-left hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-medium leading-snug">
            {prenda.clienteNombre}
          </p>
          <p className="text-sm text-muted-foreground">
            {prenda.disenoTela} · {prenda.tipoPrenda}
            {prenda.talla ? ` · ${prenda.talla}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Editar"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(prenda);
            }}
          >
            <PencilIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Duplicar"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(prenda);
            }}
          >
            <CopyIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Archivar"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(prenda);
            }}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Proveedor: {prenda.proveedor.nombre}
      </p>
      <p className="text-xs text-muted-foreground">
        Entrega: {formatFecha(prenda.fechaEntregaSolicitada)} · Envío: {envio}
      </p>
      {prenda.montoPagado !== null && (
        <p className="text-xs text-muted-foreground">
          Monto: {formatMonto(prenda.montoPagado)}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className={estadoFabricacion.colorClasses}>
          {estadoFabricacion.label}
        </Badge>
        <Badge variant="outline" className={estadoPago.colorClasses}>
          {estadoPago.label}
        </Badge>
        {alerta && (
          <Badge variant="outline" className={alertaClasses[alerta.nivel]}>
            {alerta.label}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function PrendaTable({
  prendas,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
}: {
  prendas: Prenda[];
  onView: (prenda: Prenda) => void;
  onEdit: (prenda: Prenda) => void;
  onDuplicate: (prenda: Prenda) => void;
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
    <>
      <div className="hidden overflow-x-auto rounded-md border md:block">
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
            <th className="sticky right-0 z-10 border-l bg-muted px-3 py-2 font-medium">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((p) => (
            <Fila
              key={p.id}
              prenda={p}
              onView={onView}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
            />
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

      <div className="flex flex-col gap-2 md:hidden">
        {ordenadas.map((p) => (
          <FilaCard
            key={p.id}
            prenda={p}
            onView={onView}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
          />
        ))}
        {ordenadas.length === 0 && (
          <p className="rounded-md border px-3 py-6 text-center text-muted-foreground">
            Sin prendas que coincidan con los filtros.
          </p>
        )}
      </div>
    </>
  );
}
