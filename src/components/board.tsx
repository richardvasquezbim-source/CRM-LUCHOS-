"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PedidoForm } from "@/components/pedido-form";
import { ESTADOS, type EstadoKey } from "@/lib/estados";
import { createPedido, updateEstado, updatePedido } from "@/app/pedidos/actions";
import { PlusIcon } from "lucide-react";

export type Pedido = {
  id: string;
  clienteNombre: string;
  contacto: string;
  modelo: string;
  estado: string;
  fechaSolicitada: Date | null;
  fechaEnvioReal: Date | null;
  montoPagado: number | null;
  nota: string | null;
};

function formatFecha(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMonto(m: number | null) {
  if (m === null || m === undefined) return null;
  return m.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function PedidoCard({
  pedido,
  onEdit,
}: {
  pedido: Pedido;
  onEdit: (pedido: Pedido) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const fechaSolicitada = formatFecha(pedido.fechaSolicitada);
  const monto = formatMonto(pedido.montoPagado);

  return (
    <Card className="gap-2 p-3">
      <button
        type="button"
        onClick={() => onEdit(pedido)}
        className="text-left"
      >
        <p className="font-medium leading-snug">{pedido.clienteNombre}</p>
        <p className="text-sm text-muted-foreground">{pedido.modelo}</p>
        <p className="text-xs text-muted-foreground">{pedido.contacto}</p>
        {fechaSolicitada && (
          <p className="text-xs text-muted-foreground">
            Envio deseado: {fechaSolicitada}
          </p>
        )}
        {monto && <p className="text-xs font-medium">{monto}</p>}
        {pedido.nota && (
          <p className="mt-1 truncate text-xs text-muted-foreground italic">
            {pedido.nota}
          </p>
        )}
      </button>
      <select
        value={pedido.estado}
        disabled={isPending}
        onChange={(e) => {
          const estado = e.target.value as EstadoKey;
          startTransition(() => {
            updateEstado(pedido.id, estado);
          });
        }}
        className="mt-1 h-7 rounded-md border border-input bg-transparent px-1.5 text-xs disabled:opacity-50"
      >
        {ESTADOS.map((e) => (
          <option key={e.key} value={e.key}>
            {e.label}
          </option>
        ))}
      </select>
    </Card>
  );
}

export function Board({ pedidos }: { pedidos: Pedido[] }) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter(
      (p) =>
        p.clienteNombre.toLowerCase().includes(q) ||
        p.modelo.toLowerCase().includes(q)
    );
  }, [pedidos, query]);

  const boundUpdate = editingPedido
    ? updatePedido.bind(null, editingPedido.id)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por cliente o modelo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="ml-auto">
                <PlusIcon /> Nuevo pedido
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo pedido</DialogTitle>
            </DialogHeader>
            <PedidoForm
              action={createPedido}
              submitLabel="Crear pedido"
              onSuccess={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ESTADOS.map((estadoInfo) => {
          const columnPedidos = filtered.filter(
            (p) => p.estado === estadoInfo.key
          );
          return (
            <div key={estadoInfo.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge className={estadoInfo.colorClasses} variant="outline">
                  {estadoInfo.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {columnPedidos.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {columnPedidos.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onEdit={setEditingPedido}
                  />
                ))}
                {columnPedidos.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sin pedidos aqui.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!editingPedido}
        onOpenChange={(open) => !open && setEditingPedido(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar pedido</DialogTitle>
          </DialogHeader>
          {editingPedido && boundUpdate && (
            <PedidoForm
              pedido={editingPedido}
              action={boundUpdate}
              submitLabel="Guardar cambios"
              onSuccess={() => setEditingPedido(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
