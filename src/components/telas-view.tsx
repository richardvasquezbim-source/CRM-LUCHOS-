"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TelaForm } from "@/components/tela-form";
import { CopiarBoton } from "@/components/copiar-boton";
import { createTela, updateTela, eliminarTela } from "@/app/telas/actions";
import { formatFechaSoloDia } from "@/lib/alerta";
import { formatMonto } from "@/lib/formato";
import { telasATSV } from "@/lib/exportar-tsv";
import {
  PlusIcon,
  PencilIcon,
  CopyIcon,
  Trash2Icon,
  ArrowLeftIcon,
  ScissorsIcon,
  FactoryIcon,
} from "lucide-react";
import { toast } from "sonner";

export type Tela = {
  id: string;
  nombre: string;
  costoPorMetro: number | null;
  metrajeDisponible: number;
  unidad: string;
  unidadOriginal: string | null;
  costoTotal: number | null;
  fechaCompra: Date | null;
  fechaEnvio: Date | null;
  estado: string;
};

function fecha(d: Date | null) {
  return formatFechaSoloDia(d) ?? "-";
}

function cantidad(t: Tela) {
  const unidad = t.unidad === "kg" ? "kg" : "m";
  return `${t.metrajeDisponible} ${unidad}`;
}

export function TelasView({ telas }: { telas: Tela[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editando, setEditando] = useState<Tela | null>(null);
  const [duplicando, setDuplicando] = useState<Tela | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tela | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const boundUpdate = editando ? updateTela.bind(null, editando.id) : null;

  function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    startDeleting(async () => {
      const res = await eliminarTela(id);
      if (res.ok) {
        toast.success("Tela eliminada");
        setConfirmDelete(null);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" render={<Link href="/" />}>
          <ArrowLeftIcon /> Prendas
        </Button>
        <Button variant="outline" render={<Link href="/pedidos-ericka" />}>
          <FactoryIcon /> Producción
        </Button>
        <h1 className="text-2xl font-semibold">Telas</h1>
        <div className="ml-auto flex items-center gap-2">
          {telas.length > 0 && (
            <CopiarBoton
              texto={telasATSV(telas)}
              label="Copiar para Sheets"
              size="default"
            />
          )}
          <Dialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            disablePointerDismissal
          >
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon /> Nueva tela
                </Button>
              }
            />
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nueva tela</DialogTitle>
              </DialogHeader>
              <TelaForm
                action={createTela}
                submitLabel="Crear tela"
                onSuccess={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium">Tela</th>
              <th className="px-3 py-2 font-medium">Disponible</th>
              <th className="px-3 py-2 font-medium">Costo/m</th>
              <th className="px-3 py-2 font-medium">Costo total</th>
              <th className="px-3 py-2 font-medium">Compra</th>
              <th className="px-3 py-2 font-medium">Envío</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {telas.map((t) => (
              <tr key={t.id} className="border-b hover:bg-muted/50">
                <td className="px-3 py-2 font-medium">
                  {t.nombre}
                  {t.unidadOriginal && (
                    <span className="ml-1 text-xs text-muted-foreground italic">
                      ({t.unidadOriginal})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{cantidad(t)}</td>
                <td className="px-3 py-2">{formatMonto(t.costoPorMetro)}</td>
                <td className="px-3 py-2">{formatMonto(t.costoTotal)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {fecha(t.fechaCompra)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {fecha(t.fechaEnvio)}
                </td>
                <td className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className={
                      t.estado === "agotada"
                        ? "border-slate-200 bg-slate-100 text-slate-700"
                        : "border-green-200 bg-green-100 text-green-800"
                    }
                  >
                    {t.estado === "agotada" ? "Agotada" : "Disponible"}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/pedidos-ericka/${t.id}`} />}
                    >
                      <ScissorsIcon /> Pedido a Ericka
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Editar"
                      onClick={() => setEditando(t)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Duplicar"
                      onClick={() => setDuplicando(t)}
                    >
                      <CopyIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Eliminar"
                      onClick={() => setConfirmDelete(t)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {telas.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  Aún no hay telas registradas. Usá &quot;Nueva tela&quot; para
                  empezar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!editando}
        onOpenChange={(open) => !open && setEditando(null)}
        disablePointerDismissal
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar tela</DialogTitle>
          </DialogHeader>
          {editando && boundUpdate && (
            <TelaForm
              tela={editando}
              action={boundUpdate}
              submitLabel="Guardar cambios"
              onSuccess={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicar: formulario de creación precargado con otra tela. */}
      <Dialog
        open={!!duplicando}
        onOpenChange={(open) => !open && setDuplicando(null)}
        disablePointerDismissal
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Duplicar tela</DialogTitle>
          </DialogHeader>
          {duplicando && (
            <TelaForm
              tela={duplicando}
              action={createTela}
              submitLabel="Crear copia"
              onSuccess={() => setDuplicando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta tela?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDelete?.nombre} · {confirmDelete && cantidad(confirmDelete)}
            <br />
            Se borra de forma definitiva.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
