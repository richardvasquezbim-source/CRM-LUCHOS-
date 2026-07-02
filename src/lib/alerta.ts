export type NivelAlerta = "vencido" | "proximo" | "ok";

export type Alerta = {
  nivel: NivelAlerta;
  label: string;
} | null;

const DIAS_PROXIMO = 3;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Las fechas de entrega vienen de un <input type="date"> (solo día, sin hora) y
 * JS las parsea como medianoche UTC. Comparamos/mostramos todo en UTC para que el
 * día no se corra según la zona horaria de la máquina donde corre el servidor.
 */
function diaUTC(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function hoyUTC() {
  const ahora = new Date();
  return Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export function formatFechaSoloDia(
  fecha: Date | string | null | undefined
): string | null {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function calcularAlerta(
  fechaEntregaSolicitada: Date | string | null,
  estadoFabricacion: string
): Alerta {
  if (estadoFabricacion === "enviado" || !fechaEntregaSolicitada) return null;

  const entregaUTC = diaUTC(new Date(fechaEntregaSolicitada));
  const dias = Math.round((entregaUTC - hoyUTC()) / MS_POR_DIA);

  if (dias < 0) {
    return { nivel: "vencido", label: "⛔ Vencido" };
  }

  if (dias <= DIAS_PROXIMO) {
    const fechaCorta = new Date(entregaUTC).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    });
    return { nivel: "proximo", label: `⚠ Próximo: ${fechaCorta} (${dias}d)` };
  }

  return { nivel: "ok", label: "✅ OK" };
}
