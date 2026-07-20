export type NivelAlerta = "vencido" | "proximo" | "ok";

export type Alerta = {
  nivel: NivelAlerta;
  label: string;
} | null;

const DIAS_PROXIMO = 3;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * El negocio opera en Perú. Se fija explícitamente (en vez de usar la zona
 * de la máquina) porque el servidor de Vercel corre en UTC: si no, el día
 * mostrado en el servidor y en el navegador no coincidirían.
 */
export const ZONA_HORARIA = "America/Lima";

/**
 * Las fechas de entrega vienen de un <input type="date"> (solo día, sin hora) y
 * JS las parsea como medianoche UTC. Comparamos/mostramos todo en UTC para que el
 * día no se corra según la zona horaria de la máquina donde corre el servidor.
 */
function diaUTC(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * El "hoy" del negocio, en hora de Perú, expresado como día UTC para poder
 * compararlo con `diaUTC`. Antes se tomaba el día de la máquina: en el
 * servidor (UTC) eso adelantaba la fecha desde las 7 pm de Lima, y las
 * entregas se marcaban vencidas un día antes de tiempo.
 */
function hoyUTC() {
  const [anio, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);

  return Date.UTC(anio, mes - 1, dia);
}

export function formatFechaSoloDia(
  fecha: Date | string | null | undefined
): string | null {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Para marcas de tiempo reales (`createdAt` / `updatedAt`), que sí llevan hora.
 * A diferencia de las fechas de entrega, estas se muestran en hora de Perú:
 * algo registrado a las 8 de la noche debe leerse con la fecha de ese día.
 */
export function formatMarcaTiempo(
  fecha: Date | string | null | undefined,
  { conHora = false }: { conHora?: boolean } = {}
): string | null {
  if (!fecha) return null;

  const opciones: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA_HORARIA,
  };

  if (conHora) {
    opciones.hour = "2-digit";
    opciones.minute = "2-digit";
  }

  return new Date(fecha).toLocaleString("es-PE", opciones);
}

/** Igual que arriba pero en formato AAAA-MM-DD, para el respaldo de Excel. */
export function formatMarcaTiempoISO(fecha: Date | string | null | undefined) {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha));
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
    const fechaCorta = new Date(entregaUTC).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    });
    return { nivel: "proximo", label: `⚠ Próximo: ${fechaCorta} (${dias}d)` };
  }

  return { nivel: "ok", label: "✅ OK" };
}
