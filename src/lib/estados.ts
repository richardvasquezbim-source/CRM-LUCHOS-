export const ESTADOS_FABRICACION = [
  {
    key: "compra_tela_pendiente",
    label: "Compra de tela pendiente",
    colorClasses: "bg-slate-100 text-slate-800 border-slate-200",
  },
  {
    key: "tela_entregada",
    label: "Tela entregada - en confección",
    colorClasses: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    key: "confeccionado",
    label: "Confeccionado - pendiente de recojo",
    colorClasses: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    key: "listo_envio",
    label: "Listo para envío",
    colorClasses: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    key: "enviado",
    label: "Enviado",
    colorClasses: "bg-green-100 text-green-800 border-green-200",
  },
] as const;

export const ESTADOS_PAGO = [
  {
    key: "interesado",
    label: "Interesado",
    colorClasses: "bg-slate-100 text-slate-800 border-slate-200",
  },
  {
    key: "falta_pago",
    label: "Falta que pague",
    colorClasses: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    key: "pagado",
    label: "Pagado",
    colorClasses: "bg-green-100 text-green-800 border-green-200",
  },
] as const;

export type EstadoFabricacionKey = (typeof ESTADOS_FABRICACION)[number]["key"];
export type EstadoPagoKey = (typeof ESTADOS_PAGO)[number]["key"];

export const ESTADO_FABRICACION_KEYS = ESTADOS_FABRICACION.map(
  (e) => e.key
) as EstadoFabricacionKey[];
export const ESTADO_PAGO_KEYS = ESTADOS_PAGO.map((e) => e.key) as EstadoPagoKey[];

export function getEstadoFabricacion(key: string) {
  return ESTADOS_FABRICACION.find((e) => e.key === key) ?? ESTADOS_FABRICACION[0];
}

export function getEstadoPago(key: string) {
  return ESTADOS_PAGO.find((e) => e.key === key) ?? ESTADOS_PAGO[0];
}
