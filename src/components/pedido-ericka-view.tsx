"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generarPedidoEricka,
  guardarItemsEricka,
  marcarPedidoEnviado,
} from "@/app/pedidos-ericka/actions";
import { formatMarcaTiempo } from "@/lib/alerta";
import {
  PlusIcon,
  SaveIcon,
  CopyIcon,
  SendIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

type Item = {
  talla: number;
  tipoPrenda: string;
  cantidad: number;
  clienteNombre: string | null;
};

export type PedidoEricka = {
  id: string;
  estado: string;
  generadoEn: Date;
  enviadoEn: Date | null;
  items: {
    talla: number;
    tipoPrenda: string;
    cantidad: number;
    esPedidoCliente: boolean;
    clienteNombre: string | null;
  }[];
};

export type TelaResumen = {
  id: string;
  nombre: string;
  metrajeDisponible: number;
  unidad: string;
  estado: string;
};

const TALLAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const selectClass =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm";

function cantidadTela(t: TelaResumen) {
  return `${t.metrajeDisponible} ${t.unidad === "kg" ? "kg" : "m"}`;
}

export function PedidoErickaView({
  tela,
  pedido,
  pendientes,
}: {
  tela: TelaResumen;
  pedido: PedidoEricka | null;
  pendientes: number;
}) {
  const enviado = pedido?.estado === "enviado";
  const [items, setItems] = useState<Item[]>(
    () =>
      pedido?.items.map((i) => ({
        talla: i.talla,
        tipoPrenda: i.tipoPrenda,
        cantidad: i.cantidad,
        clienteNombre: i.clienteNombre,
      })) ?? []
  );
  const [generando, startGenerar] = useTransition();
  const [guardando, startGuardar] = useTransition();
  const [enviando, startEnviar] = useTransition();

  function setItem(idx: number, patch: Partial<Item>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function agregarFila() {
    setItems((arr) => [
      ...arr,
      { talla: 0, tipoPrenda: "", cantidad: 1, clienteNombre: null },
    ]);
  }
  function eliminarFila(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx));
  }

  function handleGenerar(reemplazar: boolean) {
    if (reemplazar && !confirm("Se reemplazará la tabla actual con una nueva propuesta. ¿Continuar?")) {
      return;
    }
    startGenerar(async () => {
      await generarPedidoEricka(tela.id);
      toast.success("Pedido generado");
    });
  }

  function handleGuardar() {
    if (!pedido) return;
    startGuardar(async () => {
      await guardarItemsEricka(pedido.id, items);
      toast.success("Cambios guardados");
    });
  }

  function handleEnviar() {
    if (!pedido) return;
    if (
      !confirm(
        "Se marcará como enviado a Ericka y se descontará el metraje usado de la tela. ¿Continuar?"
      )
    ) {
      return;
    }
    startEnviar(async () => {
      await marcarPedidoEnviado(pedido.id);
      toast.success("Marcado como enviado. Metraje descontado.");
    });
  }

  function copiarWhatsapp() {
    const lineas = items
      .filter((i) => i.tipoPrenda.trim() || i.clienteNombre)
      .map((i) => {
        const base = `Talla ${i.talla} · ${i.tipoPrenda || "-"} · x${i.cantidad}`;
        return i.clienteNombre ? `${base} — ${i.clienteNombre} ⭐` : base;
      });
    const texto = [
      "*Pedido para Ericka*",
      `Tela: ${tela.nombre} (${cantidadTela(tela)})`,
      "",
      ...lineas,
    ].join("\n");
    navigator.clipboard.writeText(texto).then(
      () => toast.success("Copiado. Pégalo en WhatsApp."),
      () => toast.error("No se pudo copiar")
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" render={<Link href="/telas" />}>
          <ArrowLeftIcon /> Telas
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Pedido para Ericka</h1>
          <p className="text-sm text-muted-foreground">
            {tela.nombre} · {cantidadTela(tela)}
            {tela.estado === "agotada" && " · agotada"}
          </p>
        </div>
      </div>

      {!pedido && (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed p-6">
          <p className="text-sm">
            {pendientes > 0 ? (
              <>
                Hay <strong>{pendientes}</strong>{" "}
                {pendientes === 1 ? "pedido pendiente" : "pedidos pendientes"}{" "}
                para esta tela.
              </>
            ) : (
              "No hay pedidos pendientes vinculados a esta tela. Igual puedes generar una propuesta (o armar la tabla a mano)."
            )}
          </p>
          <Button disabled={generando} onClick={() => handleGenerar(false)}>
            <RefreshCwIcon /> Generar automáticamente
          </Button>
        </div>
      )}

      {pedido && (
        <>
          {enviado && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Enviado a Ericka el{" "}
              {formatMarcaTiempo(pedido.enviadoEn, { conHora: true })}. Esta
              tabla queda como historial.
            </div>
          )}

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Talla</th>
                  <th className="px-3 py-2 font-medium">Tipo de prenda</th>
                  <th className="px-3 py-2 font-medium">Cantidad</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  {!enviado && <th className="px-3 py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const resaltado = !!(it.clienteNombre && it.clienteNombre.trim());
                  return (
                    <tr
                      key={idx}
                      className={
                        resaltado
                          ? "border-b bg-amber-100 dark:bg-amber-950"
                          : "border-b"
                      }
                    >
                      <td className="px-3 py-1.5">
                        {enviado ? (
                          it.talla
                        ) : (
                          <select
                            value={it.talla}
                            onChange={(e) =>
                              setItem(idx, { talla: Number(e.target.value) })
                            }
                            className={selectClass}
                          >
                            {TALLAS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {enviado ? (
                          it.tipoPrenda || "-"
                        ) : (
                          <Input
                            value={it.tipoPrenda}
                            onChange={(e) =>
                              setItem(idx, { tipoPrenda: e.target.value })
                            }
                            className="h-8"
                          />
                        )}
                      </td>
                      <td className="px-3 py-1.5 w-24">
                        {enviado ? (
                          it.cantidad
                        ) : (
                          <Input
                            type="number"
                            min="1"
                            value={it.cantidad}
                            onChange={(e) =>
                              setItem(idx, {
                                cantidad: Number(e.target.value) || 1,
                              })
                            }
                            className="h-8"
                          />
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {enviado ? (
                          it.clienteNombre || "-"
                        ) : (
                          <Input
                            value={it.clienteNombre ?? ""}
                            placeholder="(opcional)"
                            onChange={(e) =>
                              setItem(idx, {
                                clienteNombre: e.target.value || null,
                              })
                            }
                            className="h-8"
                          />
                        )}
                      </td>
                      {!enviado && (
                        <td className="px-3 py-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Quitar fila"
                            onClick={() => eliminarFila(idx)}
                          >
                            <Trash2Icon />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={enviado ? 4 : 5}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      La tabla está vacía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Las filas <span className="rounded bg-amber-100 px-1">amarillas</span>{" "}
            son pedidos reales de un cliente (tienen nombre). El resto son
            sugerencias que puedes ajustar libremente.
          </p>

          <div className="flex flex-wrap gap-2">
            {!enviado && (
              <>
                <Button type="button" variant="outline" onClick={agregarFila}>
                  <PlusIcon /> Agregar fila
                </Button>
                <Button
                  type="button"
                  disabled={guardando}
                  onClick={handleGuardar}
                >
                  <SaveIcon /> Guardar cambios
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={copiarWhatsapp}>
              <CopyIcon /> Copiar para WhatsApp
            </Button>
            {!enviado && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={generando}
                  onClick={() => handleGenerar(true)}
                >
                  <RefreshCwIcon /> Regenerar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={enviando}
                  onClick={handleEnviar}
                >
                  <SendIcon /> Marcar como enviado a Ericka
                </Button>
              </>
            )}
            {enviado && (
              <Button
                type="button"
                disabled={generando}
                onClick={() => handleGenerar(true)}
              >
                <RefreshCwIcon /> Generar nuevo pedido
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
