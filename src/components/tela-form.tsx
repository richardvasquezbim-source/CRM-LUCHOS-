"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  initialTelaFormState,
  type TelaFormState,
} from "@/lib/validations/tela";
import type { Tela } from "@/components/telas-view";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm";

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function TelaForm({
  tela,
  action,
  onSuccess,
  submitLabel = "Guardar",
}: {
  tela?: Tela;
  action: (
    prevState: TelaFormState,
    formData: FormData
  ) => Promise<TelaFormState>;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTelaFormState
  );
  const handledSuccess = useRef(false);
  const [unidad, setUnidad] = useState(tela?.unidad ?? "metros");

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="nombre">Nombre de la tela</FieldLabel>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={tela?.nombre}
            placeholder="Ej. Gamuza Snoopy amarillo"
            required
          />
          {state.errors.nombre && (
            <FieldError>{state.errors.nombre[0]}</FieldError>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="metrajeDisponible">Cantidad</FieldLabel>
            <Input
              id="metrajeDisponible"
              name="metrajeDisponible"
              type="number"
              step="0.01"
              min="0"
              defaultValue={tela?.metrajeDisponible ?? ""}
            />
            {state.errors.metrajeDisponible && (
              <FieldError>{state.errors.metrajeDisponible[0]}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="unidad">Unidad</FieldLabel>
            <select
              id="unidad"
              name="unidad"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className={selectClass}
            >
              <option value="metros">Metros</option>
              <option value="kg">Kilos</option>
            </select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="unidadOriginal">
            Nota de cantidad (opcional)
          </FieldLabel>
          <Input
            id="unidadOriginal"
            name="unidadOriginal"
            defaultValue={tela?.unidadOriginal ?? ""}
            placeholder="Tal cual lo anotaste, ej. &quot;1 kg y medio&quot;"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="costoPorMetro">Costo por metro</FieldLabel>
            <Input
              id="costoPorMetro"
              name="costoPorMetro"
              type="number"
              step="0.01"
              min="0"
              defaultValue={tela?.costoPorMetro ?? ""}
            />
            {state.errors.costoPorMetro && (
              <FieldError>{state.errors.costoPorMetro[0]}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="costoTotal">Costo total</FieldLabel>
            <Input
              id="costoTotal"
              name="costoTotal"
              type="number"
              step="0.01"
              min="0"
              defaultValue={tela?.costoTotal ?? ""}
            />
            {state.errors.costoTotal && (
              <FieldError>{state.errors.costoTotal[0]}</FieldError>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="fechaCompra">Fecha de compra</FieldLabel>
            <Input
              id="fechaCompra"
              name="fechaCompra"
              type="date"
              defaultValue={toDateInputValue(tela?.fechaCompra)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="fechaEnvio">Fecha de envío</FieldLabel>
            <Input
              id="fechaEnvio"
              name="fechaEnvio"
              type="date"
              defaultValue={toDateInputValue(tela?.fechaEnvio)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="estado">Estado</FieldLabel>
          <select
            id="estado"
            name="estado"
            defaultValue={tela?.estado ?? "disponible"}
            className={selectClass}
          >
            <option value="disponible">Disponible</option>
            <option value="agotada">Agotada</option>
          </select>
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
