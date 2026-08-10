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
import { SelectorCatalogo } from "@/components/selector-catalogo";
import type { CatalogoModelo } from "@/lib/catalogo";

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
  telaId?: string | null;
  tipoPedido?: string | null;
  catalogoGrupo?: string | null;
  tallaNumero?: number | null;
};

export type ProveedorOption = {
  id: string;
  nombre: string;
  activo: boolean;
};

export type TelaOption = {
  id: string;
  nombre: string;
  estado: string;
};

const TALLAS_PRODUCCION = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm";

/** Si el texto de talla es un entero 0-10, lo devuelve como string; si no, "". */
function tallaNumDesdeTexto(talla: string | null | undefined): string {
  const t = (talla ?? "").trim();
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    if (n >= 0 && n <= 10) return String(n);
  }
  return "";
}

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
  telaId: string;
  tipoPedido: string;
  catalogoGrupo: string;
  tallaNumero: string;
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
    telaId: prenda?.telaId ?? "",
    tipoPedido: prenda?.tipoPedido ?? "",
    catalogoGrupo: prenda?.catalogoGrupo ?? "",
    // Si no hay talla numérica guardada, la deducimos del texto de talla.
    tallaNumero:
      prenda?.tallaNumero !== null && prenda?.tallaNumero !== undefined
        ? String(prenda.tallaNumero)
        : tallaNumDesdeTexto(prenda?.talla),
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
  telas = [],
  catalogoModelos = [],
  action,
  onSuccess,
  submitLabel = "Guardar",
  draftKey,
}: {
  prenda?: PrendaFormValues;
  proveedores: ProveedorOption[];
  telas?: TelaOption[];
  catalogoModelos?: CatalogoModelo[];
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

        {/* Producción — datos para el pedido a Ericka. Todo opcional. */}
        <div className="flex flex-col gap-3 rounded-md border border-dashed p-3">
          <p className="text-sm font-medium">🧵 Producción (opcional)</p>

          <Field orientation="responsive">
            <FieldLabel htmlFor="telaId">Tela</FieldLabel>
            <select
              id="telaId"
              name="telaId"
              value={values.telaId}
              onChange={(e) => set("telaId", e.target.value)}
              className={selectClass}
            >
              <option value="">— Sin tela —</option>
              {telas
                .filter((t) => t.estado === "disponible" || t.id === values.telaId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                    {t.estado === "agotada" ? " (agotada)" : ""}
                  </option>
                ))}
            </select>
          </Field>

          <Field orientation="responsive">
            <FieldLabel htmlFor="tipoPedido">Tipo de pedido</FieldLabel>
            <select
              id="tipoPedido"
              name="tipoPedido"
              value={values.tipoPedido}
              onChange={(e) => {
                const v = e.target.value;
                set("tipoPedido", v);
                // Al dejar de ser reposición, se limpia el modelo del catálogo.
                if (v !== "reposicion") set("catalogoGrupo", "");
              }}
              className={selectClass}
            >
              <option value="">— Sin especificar —</option>
              <option value="reposicion">Reposición</option>
              <option value="nueva">Prenda nueva</option>
            </select>
          </Field>

          <Field orientation="responsive">
            <FieldLabel htmlFor="tallaNumero">Talla (0–10)</FieldLabel>
            <select
              id="tallaNumero"
              name="tallaNumero"
              value={values.tallaNumero}
              onChange={(e) => set("tallaNumero", e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              {TALLAS_PRODUCCION.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          {values.tipoPedido === "reposicion" && (
            <Field>
              <FieldLabel>Diseño del catálogo (para revisar stock)</FieldLabel>
              <SelectorCatalogo
                modelos={catalogoModelos}
                value={values.catalogoGrupo}
                onChange={(grupo) => set("catalogoGrupo", grupo)}
              />
            </Field>
          )}
          <input type="hidden" name="catalogoGrupo" value={values.catalogoGrupo} />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
