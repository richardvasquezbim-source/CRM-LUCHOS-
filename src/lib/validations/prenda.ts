import { z } from "zod";
import {
  ESTADO_FABRICACION_KEYS,
  ESTADO_PAGO_KEYS,
  type EstadoFabricacionKey,
  type EstadoPagoKey,
} from "@/lib/estados";

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null || val === undefined ? undefined : val;

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalMonto = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "El monto no puede ser negativo").optional()
);

export const prendaSchema = z.object({
  clienteNombre: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  contacto: optionalString,
  disenoTela: z.string().trim().min(1, "El diseño/tela es obligatorio"),
  talla: optionalString,
  tipoPrenda: z.string().trim().min(1, "El tipo de prenda es obligatorio"),
  proveedorId: z.string().trim().min(1, "El proveedor es obligatorio"),
  estadoFabricacion: z.enum(
    ESTADO_FABRICACION_KEYS as [EstadoFabricacionKey, ...EstadoFabricacionKey[]]
  ),
  estadoPago: z.enum(ESTADO_PAGO_KEYS as [EstadoPagoKey, ...EstadoPagoKey[]]),
  fechaCompra: optionalDate,
  fechaEntregaSolicitada: optionalDate,
  fechaEnvioReal: optionalDate,
  montoPagado: optionalMonto,
  nota: optionalString,
});

export type PrendaInput = z.infer<typeof prendaSchema>;

export type PrendaFormState = {
  errors: Partial<Record<keyof PrendaInput, string[]>>;
  message?: string;
  success?: boolean;
};

export const initialPrendaFormState: PrendaFormState = { errors: {} };
