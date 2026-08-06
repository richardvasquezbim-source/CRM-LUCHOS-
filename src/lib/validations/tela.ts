import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  val === "" || val === null || val === undefined ? undefined : val;

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "No puede ser negativo").optional()
);
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const telaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la tela es obligatorio"),
  metrajeDisponible: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().min(0, "No puede ser negativo")
  ),
  unidad: z.enum(["metros", "kg"]),
  unidadOriginal: optionalString,
  costoPorMetro: optionalNumber,
  costoTotal: optionalNumber,
  fechaCompra: optionalDate,
  fechaEnvio: optionalDate,
  estado: z.enum(["disponible", "agotada"]),
});

export type TelaInput = z.infer<typeof telaSchema>;

export type TelaFormState = {
  errors: Partial<Record<keyof TelaInput, string[]>>;
  success?: boolean;
};

export const initialTelaFormState: TelaFormState = { errors: {} };
