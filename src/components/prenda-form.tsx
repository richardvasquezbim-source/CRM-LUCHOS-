"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ESTADOS_FABRICACION, ESTADOS_PAGO } from "@/lib/estados";
import {
  initialPrendaFormState,
  type PrendaFormState,
} from "@/lib/validations/prenda";

export type PrendaFormValues = {
  clienteNombre: string;
  contacto: string | null;
  disenoTela: string;
  talla: string | null;
  tipoPrenda: string;
  proveedorId: string;
  estadoFabricacion: string;
  estadoPago: string;
  fechaCompra: Date | string | null;
  fechaEntregaSolicitada: Date | string | null;
  fechaEnvioReal: Date | string | null;
  montoPagado: number | null;
  nota: string | null;
};

export type ProveedorOption = {
  id: string;
  nombre: string;
  activo: boolean;
};

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function PrendaForm({
  prenda,
  proveedores,
  action,
  onSuccess,
  submitLabel = "Guardar",
}: {
  prenda?: PrendaFormValues;
  proveedores: ProveedorOption[];
  action: (
    prevState: PrendaFormState,
    formData: FormData
  ) => Promise<PrendaFormState>;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialPrendaFormState
  );
  const handledSuccess = useRef(false);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const proveedorOptions = proveedores.filter(
    (p) => p.activo || p.id === prenda?.proveedorId
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="clienteNombre">Cliente</FieldLabel>
          <Input
            id="clienteNombre"
            name="clienteNombre"
            defaultValue={prenda?.clienteNombre}
            required
          />
          {state.errors.clienteNombre && (
            <FieldError>{state.errors.clienteNombre[0]}</FieldError>
          )}
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="contacto">Contacto</FieldLabel>
          <Input
            id="contacto"
            name="contacto"
            defaultValue={prenda?.contacto ?? ""}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="disenoTela">Diseño / Tela</FieldLabel>
          <Input
            id="disenoTela"
            name="disenoTela"
            defaultValue={prenda?.disenoTela}
            required
          />
          {state.errors.disenoTela && (
            <FieldError>{state.errors.disenoTela[0]}</FieldError>
          )}
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="talla">Talla</FieldLabel>
          <Input id="talla" name="talla" defaultValue={prenda?.talla ?? ""} />
        </Field>

        <Field>
          <FieldLabel htmlFor="tipoPrenda">Tipo de prenda</FieldLabel>
          <Input
            id="tipoPrenda"
            name="tipoPrenda"
            defaultValue={prenda?.tipoPrenda}
            required
          />
          {state.errors.tipoPrenda && (
            <FieldError>{state.errors.tipoPrenda[0]}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="proveedorId">Proveedor</FieldLabel>
          <Select
            name="proveedorId"
            defaultValue={prenda?.proveedorId ?? proveedorOptions[0]?.id}
            items={proveedorOptions.map((p) => ({
              value: p.id,
              label: p.activo ? p.nombre : `${p.nombre} (inactivo)`,
            }))}
          >
            <SelectTrigger id="proveedorId" className="w-full">
              <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent>
              {proveedorOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                  {!p.activo ? " (inactivo)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.proveedorId && (
            <FieldError>{state.errors.proveedorId[0]}</FieldError>
          )}
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="estadoFabricacion">
            Estado de fabricación
          </FieldLabel>
          <Select
            name="estadoFabricacion"
            defaultValue={prenda?.estadoFabricacion ?? ESTADOS_FABRICACION[0].key}
            items={ESTADOS_FABRICACION.map((e) => ({
              value: e.key,
              label: e.label,
            }))}
          >
            <SelectTrigger id="estadoFabricacion" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_FABRICACION.map((e) => (
                <SelectItem key={e.key} value={e.key}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="estadoPago">Estado de pago</FieldLabel>
          <Select
            name="estadoPago"
            defaultValue={prenda?.estadoPago ?? ESTADOS_PAGO[0].key}
            items={ESTADOS_PAGO.map((e) => ({ value: e.key, label: e.label }))}
          >
            <SelectTrigger id="estadoPago" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_PAGO.map((e) => (
                <SelectItem key={e.key} value={e.key}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="fechaCompra">Fecha de compra</FieldLabel>
          <Input
            id="fechaCompra"
            name="fechaCompra"
            type="date"
            defaultValue={toDateInputValue(prenda?.fechaCompra)}
          />
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="fechaEntregaSolicitada">
            Fecha de entrega solicitada
          </FieldLabel>
          <Input
            id="fechaEntregaSolicitada"
            name="fechaEntregaSolicitada"
            type="date"
            defaultValue={toDateInputValue(prenda?.fechaEntregaSolicitada)}
          />
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="fechaEnvioReal">Fecha de envío real</FieldLabel>
          <Input
            id="fechaEnvioReal"
            name="fechaEnvioReal"
            type="date"
            defaultValue={toDateInputValue(prenda?.fechaEnvioReal)}
          />
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="montoPagado">Monto pagado</FieldLabel>
          <Input
            id="montoPagado"
            name="montoPagado"
            type="number"
            step="0.01"
            min="0"
            defaultValue={prenda?.montoPagado ?? ""}
          />
          {state.errors.montoPagado && (
            <FieldError>{state.errors.montoPagado[0]}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="nota">Nota</FieldLabel>
          <Textarea
            id="nota"
            name="nota"
            defaultValue={prenda?.nota ?? ""}
            rows={3}
          />
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
