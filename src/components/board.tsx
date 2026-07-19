"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ESTADOS_FABRICACION,
  getEstadoPago,
  type EstadoFabricacionKey,
} from "@/lib/estados";
import { calcularAlerta, formatFechaSoloDia } from "@/lib/alerta";
import { updateEstadoFabricacion } from "@/app/prendas/actions";
import type { Prenda } from "@/components/prendas-view";
import type { ProveedorOption } from "@/components/proveedor-manager";
import { CopyIcon, Trash2Icon } from "lucide-react";

const alertaClasses: Record<string, string> = {
  vencido: "bg-red-100 text-red-800 border-red-200",
  proximo: "bg-amber-100 text-amber-800 border-amber-200",
  ok: "bg-green-100 text-green-800 border-green-200",
};

function PrendaCard({
  prenda,
  subtitulo,
  onEdit,
  onDuplicate,
  onArchive,
}: {
  prenda: Prenda;
  subtitulo: string;
  onEdit: (prenda: Prenda) => void;
  onDuplicate: (prenda: Prenda) => void;
  onArchive: (prenda: Prenda) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const fechaEntrega = formatFechaSoloDia(prenda.fechaEntregaSolicitada);
  const alerta = calcularAlerta(
    prenda.fechaEntregaSolicitada,
    prenda.estadoFabricacion
  );
  const estadoPago = getEstadoPago(prenda.estadoPago);

  return (
    <Card className="gap-2 p-3">
      <div className="flex items-start justify-between gap-1">
        <button
          type="button"
          onClick={() => onEdit(prenda)}
          className="text-left"
        >
          <p className="font-medium leading-snug">{prenda.clienteNombre}</p>
          <p className="text-sm text-muted-foreground">
            {prenda.disenoTela} · {prenda.tipoPrenda}
            {prenda.talla ? ` · ${prenda.talla}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
          {fechaEntrega && (
            <p className="text-xs text-muted-foreground">
              Entrega: {fechaEntrega}
            </p>
          )}
        </button>
        <div className="flex items-center gap-0.5">
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
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={estadoPago.colorClasses} variant="outline">
          {estadoPago.label}
        </Badge>
        {alerta && (
          <Badge variant="outline" className={alertaClasses[alerta.nivel]}>
            {alerta.label}
          </Badge>
        )}
      </div>
      <select
        value={prenda.estadoFabricacion}
        disabled={isPending}
        onChange={(e) => {
          const value = e.target.value as EstadoFabricacionKey;
          startTransition(() => {
            updateEstadoFabricacion(prenda.id, value);
          });
        }}
        className="mt-1 h-7 rounded-md border border-input bg-transparent px-1.5 text-xs disabled:opacity-50"
      >
        {ESTADOS_FABRICACION.map((e) => (
          <option key={e.key} value={e.key}>
            {e.label}
          </option>
        ))}
      </select>
    </Card>
  );
}

export function Board({
  prendas,
  proveedores,
  onEdit,
  onDuplicate,
  onArchive,
}: {
  prendas: Prenda[];
  proveedores: ProveedorOption[];
  onEdit: (prenda: Prenda) => void;
  onDuplicate: (prenda: Prenda) => void;
  onArchive: (prenda: Prenda) => void;
}) {
  const [agruparPor, setAgruparPor] = useState<"fabricacion" | "proveedor">(
    "fabricacion"
  );

  const proveedorIdsConPrendas = new Set(prendas.map((p) => p.proveedorId));
  const columnas =
    agruparPor === "fabricacion"
      ? ESTADOS_FABRICACION.map((e) => ({ key: e.key, label: e.label }))
      : proveedores
          .filter((p) => p.activo || proveedorIdsConPrendas.has(p.id))
          .map((p) => ({
            key: p.id,
            label: p.activo ? p.nombre : `${p.nombre} (inactivo)`,
          }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Agrupar por:</span>
        <Button
          type="button"
          size="sm"
          variant={agruparPor === "fabricacion" ? "default" : "outline"}
          onClick={() => setAgruparPor("fabricacion")}
        >
          Estado de fabricación
        </Button>
        <Button
          type="button"
          size="sm"
          variant={agruparPor === "proveedor" ? "default" : "outline"}
          onClick={() => setAgruparPor("proveedor")}
        >
          Proveedor
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columnas.map((columna) => {
          const prendasColumna = prendas.filter((p) =>
            agruparPor === "fabricacion"
              ? p.estadoFabricacion === columna.key
              : p.proveedorId === columna.key
          );
          return (
            <div key={columna.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{columna.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {prendasColumna.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {prendasColumna.map((prenda) => (
                  <PrendaCard
                    key={prenda.id}
                    prenda={prenda}
                    subtitulo={
                      agruparPor === "fabricacion"
                        ? prenda.proveedor.nombre
                        : ESTADOS_FABRICACION.find(
                            (e) => e.key === prenda.estadoFabricacion
                          )?.label ?? prenda.estadoFabricacion
                    }
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onArchive={onArchive}
                  />
                ))}
                {prendasColumna.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sin prendas aquí.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
