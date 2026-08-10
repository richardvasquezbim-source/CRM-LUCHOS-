"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CatalogoModelo } from "@/lib/catalogo";

/**
 * Buscador de un modelo del catálogo. Muestra etiquetas legibles
 * (tipo · diseño · color) y guarda internamente el `grupo`. Filtra en el
 * cliente sobre la lista que ya recibió, sin llamadas al servidor.
 */
export function SelectorCatalogo({
  modelos,
  value,
  onChange,
}: {
  modelos: CatalogoModelo[];
  value: string;
  onChange: (grupo: string) => void;
}) {
  const [q, setQ] = useState("");

  const seleccionado = useMemo(
    () => modelos.find((m) => m.grupo === value) ?? null,
    [modelos, value]
  );

  const resultados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return modelos.filter((m) => m.label.toLowerCase().includes(s)).slice(0, 12);
  }, [modelos, q]);

  if (seleccionado) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
        <span>
          Modelo del catálogo: <strong>{seleccionado.label}</strong>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange("");
            setQ("");
          }}
        >
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        placeholder="Buscar diseño del catálogo… (ej. Stitch)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {resultados.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {resultados.map((m) => (
            <button
              key={m.grupo}
              type="button"
              onClick={() => {
                onChange(m.grupo);
                setQ("");
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
      {q.trim() && resultados.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">Sin coincidencias.</p>
      )}
    </div>
  );
}
