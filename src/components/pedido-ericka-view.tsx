"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generarPedidoEricka,
  guardarItemsEricka,
  marcarPedidoEnviado,
} from "@/app/pedidos-ericka/actions";
import { MatrizEricka } from "@/components/matriz-ericka";
import { formatMarcaTiempo } from "@/lib/alerta";
import {
  PlusIcon,
  SaveIcon,
  CopyIcon,
  SendIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
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
const SIN_TIPO = "(sin tipo)";

function cantidadTela(t: TelaResumen) {
  return `${t.metrajeDisponible} ${t.unidad === "kg" ? "kg" : "m"}`;
}

function etiquetaTipo(tipo: string) {
  return tipo.trim() || SIN_TIPO;
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
  const [tiposExtra, setTiposExtra] = useState<string[]>([]);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [generando, startGenerar] = useTransition();
  const [guardando, startGuardar] = useTransition();
  const [enviando, startEnviar] = useTransition();

  // Columnas = tipos que aparecen en los items + los agregados a mano.
  const tipos = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.tipoPrenda.trim());
    for (const t of tiposExtra) set.add(t.trim());
    return [...set].sort((a, b) =>
      etiquetaTipo(a).localeCompare(etiquetaTipo(b), "es")
    );
  }, [items, tiposExtra]);

  function getItem(talla: number, tipo: string) {
    return items.find((i) => i.talla === talla && i.tipoPrenda.trim() === tipo);
  }

  function setCantidad(talla: number, tipo: string, raw: string) {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    setItems((arr) => {
      const idx = arr.findIndex(
        (i) => i.talla === talla && i.tipoPrenda.trim() === tipo
      );
      if (idx >= 0) {
        if (n <= 0) return arr.filter((_, i) => i !== idx);
        return arr.map((it, i) => (i === idx ? { ...it, cantidad: n } : it));
      }
      if (n <= 0) return arr;
      return [
        ...arr,
        { talla, tipoPrenda: tipo, cantidad: n, clienteNombre: null },
      ];
    });
  }

  function agregarTipo() {
    const t = nuevoTipo.trim();
    if (!t) return;
    if (!tipos.includes(t)) setTiposExtra((arr) => [...arr, t]);
    setNuevoTipo("");
  }

  function clientesDe(talla: number) {
    return [
      ...new Set(
        items
          .filter((i) => i.talla === talla && i.clienteNombre)
          .map((i) => i.clienteNombre as string)
      ),
    ].join(", ");
  }

  function handleGenerar() {
    if (
      pedido &&
      !confirm("Se reemplazará la tabla actual con una nueva propuesta. ¿Continuar?")
    ) {
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
    const orden = [...items].sort(
      (a, b) =>
        a.talla - b.talla || a.tipoPrenda.localeCompare(b.tipoPrenda, "es")
    );
    const lineas = orden
      .filter((i) => i.cantidad > 0)
      .map((i) => {
        const base = `Talla ${i.talla} · ${etiquetaTipo(i.tipoPrenda)} · x${i.cantidad}`;
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
        <Button variant="outline" render={<Link href="/pedidos-ericka" />}>
          <ArrowLeftIcon /> Producción
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
          <Button disabled={generando} onClick={handleGenerar}>
            <RefreshCwIcon /> Generar automáticamente
          </Button>
        </div>
      )}

      {pedido && enviado && (
        <>
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Enviado a Ericka el{" "}
            {formatMarcaTiempo(pedido.enviadoEn, { conHora: true })}. Esta tabla
            queda como historial.
          </div>
          <MatrizEricka items={pedido.items} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copiarWhatsapp}>
              <CopyIcon /> Copiar para WhatsApp
            </Button>
            <Button type="button" disabled={generando} onClick={handleGenerar}>
              <RefreshCwIcon /> Generar nuevo pedido
            </Button>
          </div>
        </>
      )}

      {pedido && !enviado && (
        <>
          <div className="overflow-x-auto rounded-md border">
            <table className="text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Talla</th>
                  {tipos.map((tipo) => (
                    <th
                      key={tipo}
                      className="px-3 py-2 text-center font-medium whitespace-nowrap"
                    >
                      {etiquetaTipo(tipo)}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">Cliente</th>
                </tr>
              </thead>
              <tbody>
                {TALLAS.map((talla) => (
                  <tr key={talla} className="border-b">
                    <td className="px-3 py-1.5 font-medium">{talla}</td>
                    {tipos.map((tipo) => {
                      const it = getItem(talla, tipo);
                      return (
                        <td
                          key={tipo}
                          className={
                            "px-2 py-1 text-center " +
                            (it?.clienteNombre
                              ? "bg-amber-100 dark:bg-amber-950"
                              : "")
                          }
                        >
                          <input
                            type="number"
                            min="0"
                            value={it ? it.cantidad : ""}
                            onChange={(e) =>
                              setCantidad(talla, tipo, e.target.value)
                            }
                            className="h-8 w-14 rounded-md border border-input bg-transparent px-1 text-center text-sm"
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {clientesDe(talla)}
                    </td>
                  </tr>
                ))}
                {tipos.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-4 text-center text-muted-foreground"
                    >
                      Agrega una columna de tipo de prenda para empezar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Nuevo tipo de prenda (ej. Pijama)"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarTipo();
                }
              }}
              className="max-w-xs"
            />
            <Button type="button" variant="outline" onClick={agregarTipo}>
              <PlusIcon /> Agregar columna
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Cada columna es un tipo de prenda; escribe la cantidad por talla.
            Las celdas <span className="rounded bg-amber-100 px-1">amarillas</span>{" "}
            son pedidos reales de un cliente. Deja en blanco (o 0) lo que no vas
            a coser.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={guardando} onClick={handleGuardar}>
              <SaveIcon /> Guardar cambios
            </Button>
            <Button type="button" variant="outline" onClick={copiarWhatsapp}>
              <CopyIcon /> Copiar para WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={generando}
              onClick={handleGenerar}
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
          </div>
        </>
      )}
    </div>
  );
}
