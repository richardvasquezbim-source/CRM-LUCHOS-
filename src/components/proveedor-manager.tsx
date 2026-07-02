"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProveedor, setProveedorActivo } from "@/app/prendas/actions";

export type ProveedorOption = {
  id: string;
  nombre: string;
  activo: boolean;
};

export function ProveedorManager({
  proveedores,
}: {
  proveedores: ProveedorOption[];
}) {
  const [open, setOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAgregar() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    setError(null);
    startTransition(async () => {
      const result = await createProveedor(nombre);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNuevoNombre("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Proveedores</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proveedores</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {proveedores.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span className={!p.activo ? "text-muted-foreground" : ""}>
                {p.nombre}
                {!p.activo && " (inactivo)"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => setProveedorActivo(p.id, !p.activo))
                }
              >
                {p.activo ? "Desactivar" : "Activar"}
              </Button>
            </div>
          ))}
          {proveedores.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin proveedores todavía.
            </p>
          )}
        </div>
        <div className="flex items-end gap-2 border-t pt-3">
          <div className="flex-1">
            <Input
              placeholder="Nombre del nuevo proveedor"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAgregar();
                }
              }}
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>
          <Button type="button" onClick={handleAgregar} disabled={isPending}>
            Agregar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
