// Genera la propuesta de tallas a coser para una tela, aplicando las reglas
// del negocio. Es una función pura (sin base de datos) para poder probarla.
// La automatización PROPONE: el resultado es un borrador editable.

export type PedidoPendiente = {
  clienteNombre: string;
  tipoPrenda: string;
  tipoPedido: string | null; // "reposicion" | "nueva" | null
  catalogoGrupo: string | null;
  tallaNumero: number | null;
};

export type ItemGenerado = {
  talla: number;
  tipoPrenda: string;
  cantidad: number;
  esPedidoCliente: boolean;
  clienteNombre: string | null;
  orden: number;
};

const TALLAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const UMBRAL_BAJO = 1; // stock <= esto = "talla baja"
export const KG_A_METROS = 3.6;

/** ¿La tela alcanza para una tanda completa sin analizar? (≥5m o ≥1.5kg) */
export function esTelaGrande(metraje: number, unidad: string) {
  return (
    (unidad === "metros" && metraje >= 5) || (unidad === "kg" && metraje >= 1.5)
  );
}

export function metrajeEnMetros(metraje: number, unidad: string) {
  return unidad === "kg" ? metraje * KG_A_METROS : metraje;
}

export function generarItems({
  metrajeDisponible,
  unidad,
  pedidos,
  consumo,
  stockPorGrupo,
}: {
  metrajeDisponible: number;
  unidad: string;
  pedidos: PedidoPendiente[];
  consumo: Record<number, number>;
  stockPorGrupo: Record<string, Record<number, number>>;
}): ItemGenerado[] {
  const metrajeMetros = metrajeEnMetros(metrajeDisponible, unidad);
  const consumoDe = (t: number) => consumo[t] ?? 0;

  // Une tipos que solo difieren en mayúsculas ("PIJAMA" y "Pijama" → una
  // sola columna). Se queda con la primera forma que aparece.
  const canonicalMap = new Map<string, string>();
  for (const p of pedidos) {
    const raw = (p.tipoPrenda ?? "").trim();
    const key = raw.toLowerCase();
    if (raw && !canonicalMap.has(key)) canonicalMap.set(key, raw);
  }
  const canonical = (tipo: string | null | undefined) =>
    canonicalMap.get((tipo ?? "").trim().toLowerCase()) ?? (tipo ?? "").trim();

  const items: ItemGenerado[] = [];
  // Una talla puede aparecer para varios tipos de prenda; la clave de "ya
  // cubierta" es talla + tipo (una celda de la matriz).
  const cubiertas = new Set<string>();
  const clave = (t: number, tipo: string) => `${t}|${tipo}`;
  let orden = 0;

  const push = (
    t: number,
    tipo: string,
    esCliente: boolean,
    cliente: string | null
  ): boolean => {
    if (cubiertas.has(clave(t, tipo))) return false;
    items.push({
      talla: t,
      tipoPrenda: tipo,
      cantidad: 1,
      esPedidoCliente: esCliente,
      clienteNombre: cliente,
      orden: orden++,
    });
    cubiertas.add(clave(t, tipo));
    return true;
  };

  // Columnas = tipos de prenda. Sin pedidos, una columna en blanco.
  const tipos = [
    ...new Set(pedidos.map((p) => canonical(p.tipoPrenda)).filter(Boolean)),
  ];
  if (tipos.length === 0) tipos.push("");

  // La tela se REPARTE entre los tipos: de un rollo de 5 m para 2 prendas,
  // cada tipo dispone de ~2.5 m. Así el total nunca excede la tela real.
  const presupuestoPorTipo = metrajeMetros / tipos.length;
  const GRANDE_METROS = 5; // metros por tipo que alcanzan para una tanda 0-10

  for (const tipo of tipos) {
    const pedidosTipo = pedidos.filter((p) => canonical(p.tipoPrenda) === tipo);
    let usado = 0;

    // 1. Filas de cliente de este tipo: van siempre (son pedidos reales).
    const clientes = pedidosTipo
      .filter((p) => p.tallaNumero !== null)
      .sort((a, b) => (a.tallaNumero as number) - (b.tallaNumero as number));
    for (const p of clientes) {
      const t = p.tallaNumero as number;
      if (push(t, tipo, true, p.clienteNombre)) usado += consumoDe(t);
    }

    // 2. Sugerencias, por orden de prioridad, dentro del presupuesto del tipo.
    const candidatas =
      presupuestoPorTipo >= GRANDE_METROS
        ? [...TALLAS] // alcanza para una tanda completa 0-10
        : sugerenciasPorTipo(pedidosTipo, stockPorGrupo);
    for (const t of candidatas) {
      if (cubiertas.has(clave(t, tipo))) continue;
      if (usado + consumoDe(t) > presupuestoPorTipo) continue;
      if (push(t, tipo, false, null)) usado += consumoDe(t);
    }
  }

  return items;
}

// Orden de prioridad de tallas sugeridas para un tipo con poca tela:
// reposición (agotadas → bajas) y prenda nueva (chicas 0-4 → 2 medianas).
function sugerenciasPorTipo(
  pedidosTipo: PedidoPendiente[],
  stockPorGrupo: Record<string, Record<number, number>>
): number[] {
  const agotadas = new Set<number>(); // existe en catálogo con stock 0
  const bajas = new Set<number>(); // 0 < stock <= umbral
  let hayNueva = false;
  for (const p of pedidosTipo) {
    if (p.tipoPedido === "reposicion" && p.catalogoGrupo) {
      const stock = stockPorGrupo[p.catalogoGrupo] ?? {};
      for (const [tStr, c] of Object.entries(stock)) {
        const t = Number(tStr);
        if (c <= 0) agotadas.add(t);
        else if (c <= UMBRAL_BAJO) bajas.add(t);
      }
    }
    if (p.tipoPedido === "nueva") hayNueva = true;
  }
  const base = hayNueva ? [0, 1, 2, 3, 4] : [];
  const medianas = hayNueva ? [5, 6] : []; // máx 2 medianas
  const orden = [
    ...[...agotadas].sort((a, b) => a - b),
    ...base,
    ...[...bajas].sort((a, b) => a - b),
    ...medianas,
  ];
  return [...new Set(orden)];
}
