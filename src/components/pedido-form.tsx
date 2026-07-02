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
import { ESTADOS } from "@/lib/estados";
import {
  initialPedidoFormState,
  type PedidoFormState,
} from "@/lib/validations/pedido";

export type PedidoFormValues = {
  clienteNombre: string;
  contacto: string;
  modelo: string;
  estado: string;
  fechaSolicitada: Date | string | null;
  fechaEnvioReal: Date | string | null;
  montoPagado: number | null;
  nota: string | null;
};

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function PedidoForm({
  pedido,
  action,
  onSuccess,
  submitLabel = "Guardar",
}: {
  pedido?: PedidoFormValues;
  action: (
    prevState: PedidoFormState,
    formData: FormData
  ) => Promise<PedidoFormState>;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialPedidoFormState
  );
  const handledSuccess = useRef(false);

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
          <FieldLabel htmlFor="clienteNombre">Nombre del cliente</FieldLabel>
          <Input
            id="clienteNombre"
            name="clienteNombre"
            defaultValue={pedido?.clienteNombre}
            required
          />
          {state.errors.clienteNombre && (
            <FieldError>{state.errors.clienteNombre[0]}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="contacto">Contacto (WhatsApp/telefono)</FieldLabel>
          <Input
            id="contacto"
            name="contacto"
            defaultValue={pedido?.contacto}
            required
          />
          {state.errors.contacto && (
            <FieldError>{state.errors.contacto[0]}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="modelo">Modelo de prenda/accesorio</FieldLabel>
          <Input
            id="modelo"
            name="modelo"
            defaultValue={pedido?.modelo}
            required
          />
          {state.errors.modelo && (
            <FieldError>{state.errors.modelo[0]}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="estado">Estado</FieldLabel>
          <Select name="estado" defaultValue={pedido?.estado ?? ESTADOS[0].key}>
            <SelectTrigger id="estado" className="w-full">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.key} value={e.key}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.estado && (
            <FieldError>{state.errors.estado[0]}</FieldError>
          )}
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="fechaSolicitada">
            Fecha solicitada de envio
          </FieldLabel>
          <Input
            id="fechaSolicitada"
            name="fechaSolicitada"
            type="date"
            defaultValue={toDateInputValue(pedido?.fechaSolicitada)}
          />
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="fechaEnvioReal">Fecha real de envio</FieldLabel>
          <Input
            id="fechaEnvioReal"
            name="fechaEnvioReal"
            type="date"
            defaultValue={toDateInputValue(pedido?.fechaEnvioReal)}
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
            defaultValue={pedido?.montoPagado ?? ""}
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
            defaultValue={pedido?.nota ?? ""}
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
