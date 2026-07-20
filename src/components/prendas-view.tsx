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
import { PrendaDetalle } from "@/components/prenda-detalle";
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
  vaciarPapelera,
} from "@/app/prendas/actions";
import { PlusIcon, DownloadIcon, PencilIcon, Trash2Icon } from "lucide-react";
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
  urgente: boolean;
  archivedAt: Date | null;
  /** Fecha de registro. La pone la base de datos al crear la prenda. */
  createdAt: Date;
  /** Última modificación. Prisma la actualiza sola en cada cambio. */
  updatedAt: Date;
};

/** Rangos del filtro por fecha de registro, relativos al día de hoy. */
function pasaFiltroRegistro(createdAt: Date, filtro: string) {
  if (filtro === "todos") return true;

  const fecha = new Date(createdAt);
  const ahora = new Date();
  const inicioHoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

  switch (filtro) {
    case "hoy":
      return fecha >= inicioHoy;
    case "7dias": {
      const desde = new Date(inicioHoy);
      desde.setDate(desde.getDate() - 6);
      return fecha >= desde;
    }
    case "30dias": {
      const desde = new Date(inicioHoy);
      desde.setDate(desde.getDate() - 29);
      return fecha >= desde;
    }
    case "mes":
      return fecha >= new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    case "anio":
      return fecha >= new Date(ahora.getFullYear(), 0, 1);
    default:
      return true;
  }
}

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
  const [vista, setVista] = useState<
    "tabla" | "kanban" | "enviados" | "papelera"
  >("tabla");
  const [query, setQuery] = useState("");
  const [proveedorFiltro, setProveedorFiltro] = useState("todos");
  const [fabricacionFiltro, setFabricacionFiltro] = useState("todos");
  const [pagoFiltro, setPagoFiltro] = useState("todos");
  const [alertaFiltro, setAlertaFiltro] = useState("todos");
  const [registroFiltro, setRegistroFiltro] = useState("todos");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPrenda, setEditingPrenda] = useState<Prenda | null>(null);
  const [duplicandoPrenda, setDuplicandoPrenda] = useState<Prenda | null>(null);
  const [detallePrenda, setDetallePrenda] = useState<Prenda | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Prenda | null>(null);
  const [confirmVaciar, setConfirmVaciar] = useState(false);
  const [isArchiving, startArchiving] = useTransition();
  const [isVaciando, startVaciando] = useTransition();
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
      if (!pasaFiltroRegistro(p.createdAt, registroFiltro)) return false;
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
  }, [
    prendas,
    query,
    proveedorFiltro,
    fabricacionFiltro,
    pagoFiltro,
    alertaFiltro,
    registroFiltro,
  ]);

  // Separamos los pedidos ya "enviado" para que no alarguen la tabla principal;
  // viven en su propia pestaña. El kanban sigue usando `filtered` completo.
  const filtradasActivas = useMemo(
    () => filtered.filter((p) => p.estadoFabricacion !== "enviado"),
    [filtered]
  );
  const filtradasEnviadas = useMemo(
    () => filtered.filter((p) => p.estadoFabricacion === "enviado"),
    [filtered]
  );
  const totalEnviadas = useMemo(
    () => prendas.filter((p) => p.estadoFabricacion === "enviado").length,
    [prendas]
  );

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

  function handleVaciarPapelera() {
    startVaciando(async () => {
      const { eliminadas } = await vaciarPapelera();
      toast.success(
        eliminadas === 1
          ? "Se eliminó 1 prenda definitivamente"
          : `Se eliminaron ${eliminadas} prendas definitivamente`
      );
      setConfirmVaciar(false);
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
        <select
          value={registroFiltro}
          onChange={(e) => setRegistroFiltro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Registradas: siempre</option>
          <option value="hoy">Registradas: hoy</option>
          <option value="7dias">Registradas: últimos 7 días</option>
          <option value="30dias">Registradas: últimos 30 días</option>
          <option value="mes">Registradas: este mes</option>
          <option value="anio">Registradas: este año</option>
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
            variant={vista === "enviados" ? "default" : "outline"}
            onClick={() => setVista("enviados")}
          >
            Enviados ({totalEnviadas})
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
          <Dialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            disablePointerDismissal
          >
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
                draftKey="nueva"
                onSuccess={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {vista === "tabla" && (
        <PrendaTable
          prendas={filtradasActivas}
          onView={setDetallePrenda}
          onEdit={setEditingPrenda}
          onDuplicate={setDuplicandoPrenda}
          onArchive={setConfirmArchive}
        />
      )}
      {vista === "kanban" && (
        <Board
          prendas={filtered}
          proveedores={proveedores}
          onView={setDetallePrenda}
          onEdit={setEditingPrenda}
          onDuplicate={setDuplicandoPrenda}
          onArchive={setConfirmArchive}
        />
      )}
      {vista === "enviados" && (
        <PrendaTable
          prendas={filtradasEnviadas}
          onView={setDetallePrenda}
          onEdit={setEditingPrenda}
          onDuplicate={setDuplicandoPrenda}
          onArchive={setConfirmArchive}
        />
      )}
      {vista === "papelera" && (
        <>
          {prendasArchivadas.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmVaciar(true)}
              >
                <Trash2Icon /> Vaciar papelera ({prendasArchivadas.length})
              </Button>
            </div>
          )}
          <PapeleraTable prendas={prendasArchivadas} />
        </>
      )}

      {/* Detalle en solo lectura: se abre al pulsar cualquier parte de la fila.
          Para modificar hay que pasar explícitamente por "Editar". */}
      <Dialog
        open={!!detallePrenda}
        onOpenChange={(open) => !open && setDetallePrenda(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de la prenda</DialogTitle>
          </DialogHeader>
          {detallePrenda && (
            <>
              <PrendaDetalle prenda={detallePrenda} />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetallePrenda(null)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingPrenda(detallePrenda);
                    setDetallePrenda(null);
                  }}
                >
                  <PencilIcon /> Editar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingPrenda}
        onOpenChange={(open) => !open && setEditingPrenda(null)}
        disablePointerDismissal
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
              draftKey={`editar-${editingPrenda.id}`}
              onSuccess={() => setEditingPrenda(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicar: mismo formulario de creación, precargado con otra prenda. */}
      <Dialog
        open={!!duplicandoPrenda}
        onOpenChange={(open) => !open && setDuplicandoPrenda(null)}
        disablePointerDismissal
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Duplicar prenda</DialogTitle>
          </DialogHeader>
          {duplicandoPrenda && (
            <PrendaForm
              prenda={duplicandoPrenda}
              proveedores={proveedores}
              action={createPrenda}
              submitLabel="Crear copia"
              draftKey={`duplicar-${duplicandoPrenda.id}`}
              onSuccess={() => setDuplicandoPrenda(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmVaciar} onOpenChange={setConfirmVaciar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Vaciar la papelera?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Se van a eliminar{" "}
              <strong>
                {prendasArchivadas.length}{" "}
                {prendasArchivadas.length === 1 ? "prenda" : "prendas"}
              </strong>{" "}
              de forma <strong>definitiva</strong>.
            </p>
            <p className="text-muted-foreground">
              Esto no se puede deshacer: ya no vas a poder restaurarlas ni
              aparecerán en futuras exportaciones. Si solo querías un Excel
              limpio, no hace falta vaciar nada — las archivadas ya salen en una
              hoja aparte llamada &quot;Papelera&quot;.
            </p>
            <p className="text-muted-foreground">
              Si tienes dudas, cierra esto y pulsa antes{" "}
              <strong>Exportar respaldo</strong>.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmVaciar(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isVaciando}
              onClick={handleVaciarPapelera}
            >
              {isVaciando ? "Eliminando..." : "Sí, eliminar definitivamente"}
            </Button>
          </div>
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
