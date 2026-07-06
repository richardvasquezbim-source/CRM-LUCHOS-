"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PrendaForm } from "@/components/prenda-form";
import { PrendaTable } from "@/components/prenda-table";
import { Board } from "@/components/board";
import { PapeleraTable } from "@/components/papelera-table";
import {
  ProveedorManager,
  type ProveedorOption,
} from "@/components/proveedor-manager";
import { calcularAlerta } from "@/lib/alerta";
import { ESTADOS_FABRICACION, ESTADOS_PAGO } from "@/lib/estados";
import {
  archivarPrenda,
  createPrenda,
  exportarRespaldo,
  updatePrenda,
} from "@/app/prendas/actions";
import { PlusIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";

export type Prenda = {
  id: string;
  clienteNombre: string;
  contacto: string | null;
  disenoTela: string;
  talla: string | null;
  tipoPrenda: string;
  proveedorId: string;
  proveedor: { id: string; nombre: string; activo: boolean };
  estadoFabricacion: string;
  estadoPago: string;
  fechaCompra: Date | null;
  fechaEntregaSolicitada: Date | null;
  fechaEnvioReal: Date | null;
  montoPagado: number | null;
  nota: string | null;
  archivedAt: Date | null;
};

const selectClass =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm";

export function PrendasView({
  prendas,
  prendasArchivadas,
  proveedores,
}: {
  prendas: Prenda[];
  prendasArchivadas: Prenda[];
  proveedores: ProveedorOption[];
}) {
  const [vista, setVista] = useState<"tabla" | "kanban" | "papelera">("tabla");
  const [query, setQuery] = useState("");
  const [proveedorFiltro, setProveedorFiltro] = useState("todos");
  const [fabricacionFiltro, setFabricacionFiltro] = useState("todos");
  const [pagoFiltro, setPagoFiltro] = useState("todos");
  const [alertaFiltro, setAlertaFiltro] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPrenda, setEditingPrenda] = useState<Prenda | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Prenda | null>(null);
  const [isArchiving, startArchiving] = useTransition();
  const [isExporting, startExporting] = useTransition();

  const conteoPorProveedor = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of prendas) {
      map.set(p.proveedorId, (map.get(p.proveedorId) ?? 0) + 1);
    }
    return map;
  }, [prendas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prendas.filter((p) => {
      if (
        q &&
        !p.clienteNombre.toLowerCase().includes(q) &&
        !p.disenoTela.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (proveedorFiltro !== "todos" && p.proveedorId !== proveedorFiltro) {
        return false;
      }
      if (
        fabricacionFiltro !== "todos" &&
        p.estadoFabricacion !== fabricacionFiltro
      ) {
        return false;
      }
      if (pagoFiltro !== "todos" && p.estadoPago !== pagoFiltro) return false;
      if (alertaFiltro !== "todos") {
        const alerta = calcularAlerta(
          p.fechaEntregaSolicitada,
          p.estadoFabricacion
        );
        if (alertaFiltro === "sin_alerta") {
          if (alerta !== null) return false;
        } else if (!alerta || alerta.nivel !== alertaFiltro) {
          return false;
        }
      }
      return true;
    });
  }, [prendas, query, proveedorFiltro, fabricacionFiltro, pagoFiltro, alertaFiltro]);

  const boundUpdate = editingPrenda
    ? updatePrenda.bind(null, editingPrenda.id)
    : null;

  function handleConfirmArchive() {
    if (!confirmArchive) return;
    const id = confirmArchive.id;
    startArchiving(async () => {
      await archivarPrenda(id);
      toast.success("Prenda archivada");
      setConfirmArchive(null);
    });
  }

  function handleExport() {
    startExporting(async () => {
      const { base64, filename } = await exportarRespaldo();
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        bytes[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Respaldo descargado");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por cliente o diseño..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={proveedorFiltro}
          onChange={(e) => setProveedorFiltro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los proveedores ({prendas.length})</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({conteoPorProveedor.get(p.id) ?? 0})
            </option>
          ))}
        </select>
        <select
          value={fabricacionFiltro}
          onChange={(e) => setFabricacionFiltro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los estados de fabricación</option>
          {ESTADOS_FABRICACION.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          value={pagoFiltro}
          onChange={(e) => setPagoFiltro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los estados de pago</option>
          {ESTADOS_PAGO.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          value={alertaFiltro}
          onChange={(e) => setAlertaFiltro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todas las alertas</option>
          <option value="vencido">⛔ Vencido</option>
          <option value="proximo">⚠ Próximo</option>
          <option value="ok">✅ OK</option>
          <option value="sin_alerta">Sin alerta</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant={vista === "tabla" ? "default" : "outline"}
            onClick={() => setVista("tabla")}
          >
            Tabla
          </Button>
          <Button
            type="button"
            variant={vista === "kanban" ? "default" : "outline"}
            onClick={() => setVista("kanban")}
          >
            Kanban
          </Button>
          <Button
            type="button"
            variant={vista === "papelera" ? "default" : "outline"}
            onClick={() => setVista("papelera")}
          >
            Papelera ({prendasArchivadas.length})
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={handleExport}
          >
            <DownloadIcon /> Exportar respaldo
          </Button>
          <ProveedorManager proveedores={proveedores} />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon /> Nueva prenda
                </Button>
              }
            />
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nueva prenda</DialogTitle>
              </DialogHeader>
              <PrendaForm
                proveedores={proveedores}
                action={createPrenda}
                submitLabel="Crear prenda"
                onSuccess={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {vista === "tabla" && (
        <PrendaTable
          prendas={filtered}
          onEdit={setEditingPrenda}
          onArchive={setConfirmArchive}
        />
      )}
      {vista === "kanban" && (
        <Board
          prendas={filtered}
          proveedores={proveedores}
          onEdit={setEditingPrenda}
          onArchive={setConfirmArchive}
        />
      )}
      {vista === "papelera" && (
        <PapeleraTable prendas={prendasArchivadas} />
      )}

      <Dialog
        open={!!editingPrenda}
        onOpenChange={(open) => !open && setEditingPrenda(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar prenda</DialogTitle>
          </DialogHeader>
          {editingPrenda && boundUpdate && (
            <PrendaForm
              prenda={editingPrenda}
              proveedores={proveedores}
              action={boundUpdate}
              submitLabel="Guardar cambios"
              onSuccess={() => setEditingPrenda(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmArchive}
        onOpenChange={(open) => !open && setConfirmArchive(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Archivar esta prenda?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmArchive?.clienteNombre} · {confirmArchive?.disenoTela}
            <br />
            Se va a ocultar de la tabla y el kanban. Podés restaurarla en
            cualquier momento desde la Papelera.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmArchive(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isArchiving}
              onClick={handleConfirmArchive}
            >
              Archivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
