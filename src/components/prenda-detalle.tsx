"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CircleAlertIcon } from "lucide-react";
import { formatMonto } from "@/lib/formato";
import { getEstadoFabricacion, getEstadoPago } from "@/lib/estados";
import {
  calcularAlerta,
  formatFechaSoloDia,
  formatMarcaTiempo,
} from "@/lib/alerta";
import type { Prenda } from "@/components/prendas-view";

const alertaClasses: Record<string, string> = {
  vencido: "bg-red-100 text-red-800 border-red-200",
  proximo: "bg-amber-100 text-amber-800 border-amber-200",
  ok: "bg-green-100 text-green-800 border-green-200",
};

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function fecha(d: Date | null) {
  return formatFechaSoloDia(d) ?? "-";
}

/** Vista de solo lectura de una prenda. Para editar hay que pulsar "Editar". */
export function PrendaDetalle({ prenda }: { prenda: Prenda }) {
  const estadoFabricacion = getEstadoFabricacion(prenda.estadoFabricacion);
  const estadoPago = getEstadoPago(prenda.estadoPago);
  const alerta = calcularAlerta(
    prenda.fechaEntregaSolicitada,
    prenda.estadoFabricacion
  );

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {prenda.urgente && (
        <div className="col-span-2">
          <Badge
            variant="outline"
            className="border-red-200 bg-red-100 text-red-800"
          >
            <CircleAlertIcon className="size-3.5" /> Urgente
          </Badge>
        </div>
      )}
      <Dato label="Cliente">
        <span className="font-medium">{prenda.clienteNombre}</span>
      </Dato>
      <Dato label="Contacto">{prenda.contacto || "-"}</Dato>
      <Dato label="Diseño / Tela">{prenda.disenoTela}</Dato>
      <Dato label="Talla">{prenda.talla || "-"}</Dato>
      <Dato label="Tipo de prenda">{prenda.tipoPrenda}</Dato>
      <Dato label="Proveedor">
        {prenda.proveedor.nombre}
        {!prenda.proveedor.activo && " (inactivo)"}
      </Dato>
      <Dato label="Fabricación">
        <Badge variant="outline" className={estadoFabricacion.colorClasses}>
          {estadoFabricacion.label}
        </Badge>
      </Dato>
      <Dato label="Pago">
        <Badge variant="outline" className={estadoPago.colorClasses}>
          {estadoPago.label}
        </Badge>
      </Dato>
      <Dato label="Fecha de registro">
        {formatMarcaTiempo(prenda.createdAt, { conHora: true })}
      </Dato>
      <Dato label="Última actualización">
        {formatMarcaTiempo(prenda.updatedAt, { conHora: true })}
      </Dato>
      <Dato label="Fecha de compra">{fecha(prenda.fechaCompra)}</Dato>
      <Dato label="Entrega solicitada">
        {fecha(prenda.fechaEntregaSolicitada)}
      </Dato>
      <Dato label="Envío real">{fecha(prenda.fechaEnvioReal)}</Dato>
      <Dato label="Monto pagado">{formatMonto(prenda.montoPagado)}</Dato>
      {alerta && (
        <Dato label="Alerta">
          <Badge variant="outline" className={alertaClasses[alerta.nivel]}>
            {alerta.label}
          </Badge>
        </Dato>
      )}
      <div className="col-span-2">
        <Dato label="Nota">{prenda.nota || "-"}</Dato>
      </div>
    </dl>
  );
}
