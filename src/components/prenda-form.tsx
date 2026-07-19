"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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

/** Valores del formulario como strings, tal cual viajan en el FormData. */
type FormValues = {
  clienteNombre: string;
  contacto: string;
  disenoTela: string;
  talla: string;
  tipoPrenda: string;
  proveedorId: string;
  estadoFabricacion: string;
  estadoPago: string;
  fechaCompra: string;
  fechaEntregaSolicitada: string;
  fechaEnvioReal: string;
  montoPagado: string;
  nota: string;
};

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function buildInitialValues(
  prenda: PrendaFormValues | undefined,
  proveedorOptions: ProveedorOption[]
): FormValues {
  return {
    clienteNombre: prenda?.clienteNombre ?? "",
    contacto: prenda?.contacto ?? "",
    disenoTela: prenda?.disenoTela ?? "",
    talla: prenda?.talla ?? "",
    tipoPrenda: prenda?.tipoPrenda ?? "",
    proveedorId: prenda?.proveedorId ?? proveedorOptions[0]?.id ?? "",
    estadoFabricacion: prenda?.estadoFabricacion ?? ESTADOS_FABRICACION[0].key,
    estadoPago: prenda?.estadoPago ?? ESTADOS_PAGO[0].key,
    fechaCompra: toDateInputValue(prenda?.fechaCompra),
    fechaEntregaSolicitada: toDateInputValue(prenda?.fechaEntregaSolicitada),
    fechaEnvioReal: toDateInputValue(prenda?.fechaEnvioReal),
    montoPagado:
      prenda?.montoPagado === null || prenda?.montoPagado === undefined
        ? ""
        : String(prenda.montoPagado),
    nota: prenda?.nota ?? "",
  };
}

/** Lee el borrador guardado. Devuelve null si no hay, está corrupto o no hay acceso. */
function leerBorrador(storageKey: string | null): Partial<FormValues> | null {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Partial<FormValues>) : null;
  } catch {
    return null;
  }
}

export function PrendaForm({
  prenda,
  proveedores,
  action,
  onSuccess,
  submitLabel = "Guardar",
  draftKey,
}: {
  prenda?: PrendaFormValues;
  proveedores: ProveedorOption[];
  action: (
    prevState: PrendaFormState,
    formData: FormData
  ) => Promise<PrendaFormState>;
  onSuccess?: () => void;
  submitLabel?: string;
  /**
   * Identifica el borrador en localStorage. Si se omite, no se guarda nada:
   * el formulario se comporta como antes.
   */
  draftKey?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialPrendaFormState
  );
  const handledSuccess = useRef(false);

  const proveedorOptions = useMemo(
    () => proveedores.filter((p) => p.activo || p.id === prenda?.proveedorId),
    [proveedores, prenda?.proveedorId]
  );

  const initialValues = useMemo(
    () => buildInitialValues(prenda, proveedorOptions),
    [prenda, proveedorOptions]
  );

  const storageKey = draftKey ? `crm-petshop:borrador:${draftKey}` : null;

  // Se lee una sola vez al montar. Este formulario solo existe en el cliente
  // (vive dentro de un diálogo que se abre por interacción), así que leer
  // localStorage al inicializar no provoca desajustes de hidratación.
  const [borradorInicial] = useState(() => leerBorrador(storageKey));
  const [values, setValues] = useState<FormValues>(() =>
    borradorInicial ? { ...initialValues, ...borradorInicial } : initialValues
  );
  const [borradorRestaurado, setBorradorRestaurado] = useState(
    () => borradorInicial !== null
  );

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function descartarBorrador() {
    setValues(initialValues);
    setBorradorRestaurado(false);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // localStorage no disponible: no hay borrador que limpiar
      }
    }
  }

  // Guardar automáticamente mientras se escribe (con un pequeño retraso para
  // no escribir en cada tecla).
  const yaMontado = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    if (!yaMontado.current) {
      yaMontado.current = true;
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {
        // Sin espacio o sin permiso: el formulario sigue funcionando igual
      }
    }, 300);
    return () => clearTimeout(t);
  }, [values, storageKey]);

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ver arriba
        }
      }
      onSuccess?.();
    }
  }, [state.success, onSuccess, storageKey]);

  return (
    <form action={formAction}>
      <FieldGroup>
        {borradorRestaurado && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            <span>Recuperamos lo que habías escrito sin guardar.</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={descartarBorrador}
            >
              Descartar
            </Button>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="clienteNombre">Cliente</FieldLabel>
          <Input
            id="clienteNombre"
            name="clienteNombre"
            value={values.clienteNombre}
            onChange={(e) => set("clienteNombre", e.target.value)}
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
            value={values.contacto}
            onChange={(e) => set("contacto", e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="disenoTela">Diseño / Tela</FieldLabel>
          <Input
            id="disenoTela"
            name="disenoTela"
            value={values.disenoTela}
            onChange={(e) => set("disenoTela", e.target.value)}
            required
          />
          {state.errors.disenoTela && (
            <FieldError>{state.errors.disenoTela[0]}</FieldError>
          )}
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="talla">Talla</FieldLabel>
          <Input
            id="talla"
            name="talla"
            value={values.talla}
            onChange={(e) => set("talla", e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="tipoPrenda">Tipo de prenda</FieldLabel>
          <Input
            id="tipoPrenda"
            name="tipoPrenda"
            value={values.tipoPrenda}
            onChange={(e) => set("tipoPrenda", e.target.value)}
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
            value={values.proveedorId}
            onValueChange={(v) => set("proveedorId", String(v))}
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
            value={values.estadoFabricacion}
            onValueChange={(v) => set("estadoFabricacion", String(v))}
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
            value={values.estadoPago}
            onValueChange={(v) => set("estadoPago", String(v))}
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
            value={values.fechaCompra}
            onChange={(e) => set("fechaCompra", e.target.value)}
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
            value={values.fechaEntregaSolicitada}
            onChange={(e) => set("fechaEntregaSolicitada", e.target.value)}
          />
        </Field>

        <Field orientation="responsive">
          <FieldLabel htmlFor="fechaEnvioReal">Fecha de envío real</FieldLabel>
          <Input
            id="fechaEnvioReal"
            name="fechaEnvioReal"
            type="date"
            value={values.fechaEnvioReal}
            onChange={(e) => set("fechaEnvioReal", e.target.value)}
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
            value={values.montoPagado}
            onChange={(e) => set("montoPagado", e.target.value)}
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
            value={values.nota}
            onChange={(e) => set("nota", e.target.value)}
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
