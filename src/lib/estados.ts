export const ESTADOS = [
  {
    key: "interesado",
    label: "Interesado",
    colorClasses: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    key: "falta_pago",
    label: "Falta que pague",
    colorClasses: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    key: "enviar_hoy",
    label: "Enviar hoy",
    colorClasses: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    key: "enviado",
    label: "Enviado",
    colorClasses: "bg-green-100 text-green-800 border-green-200",
  },
] as const;

export type EstadoKey = (typeof ESTADOS)[number]["key"];

export const ESTADO_KEYS = ESTADOS.map((e) => e.key) as EstadoKey[];

export function getEstado(key: string) {
  return ESTADOS.find((e) => e.key === key) ?? ESTADOS[0];
}
