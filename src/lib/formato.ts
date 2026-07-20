/**
 * El negocio cobra en soles peruanos. Vive aquí, y no duplicado en cada
 * componente, para que cambiar la moneda sea tocar un solo sitio.
 */
export function formatMonto(m: number | null | undefined) {
  if (m === null || m === undefined) return "-";
  return m.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}
