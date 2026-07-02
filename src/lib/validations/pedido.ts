import { z } from "zod";
import { ESTADO_KEYS, type EstadoKey } from "@/lib/estados";

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null || val === undefined ? undefined : val;

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalMonto = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "El monto no puede ser negativo").optional()
);
const optionalNota = z.preprocess(emptyToUndefined, z.string().optional());

export const pedidoSchema = z.object({
  clienteNombre: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  contacto: z.string().trim().min(1, "El contacto es obligatorio"),
  modelo: z.string().trim().min(1, "El modelo es obligatorio"),
  estado: z.enum(ESTADO_KEYS as [EstadoKey, ...EstadoKey[]]),
  fechaSolicitada: optionalDate,
  fechaEnvioReal: optionalDate,
  montoPagado: optionalMonto,
  nota: optionalNota,
});

export type PedidoInput = z.infer<typeof pedidoSchema>;

export type PedidoFormState = {
  errors: Partial<Record<keyof PedidoInput, string[]>>;
  message?: string;
  success?: boolean;
};

export const initialPedidoFormState: PedidoFormState = { errors: {} };
