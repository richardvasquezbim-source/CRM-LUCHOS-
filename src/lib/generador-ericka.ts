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
  const telaGrande = esTelaGrande(metrajeDisponible, unidad);
  const consumoDe = (t: number) => consumo[t] ?? 0;

  const items: ItemGenerado[] = [];
  const tallasCubiertas = new Set<number>();
  let orden = 0;
  let metrajeUsado = 0;

  // 1. Filas de cliente (resaltadas): los pedidos reales con talla numérica.
  const pedidosOrdenados = [...pedidos]
    .filter((p) => p.tallaNumero !== null)
    .sort((a, b) => (a.tallaNumero as number) - (b.tallaNumero as number));

  for (const p of pedidosOrdenados) {
    const t = p.tallaNumero as number;
    items.push({
      talla: t,
      tipoPrenda: p.tipoPrenda,
      cantidad: 1,
      esPedidoCliente: true,
      clienteNombre: p.clienteNombre,
      orden: orden++,
    });
    tallasCubiertas.add(t);
    metrajeUsado += consumoDe(t);
  }

  const tipoPrendaDefault = modaTipoPrenda(pedidos) ?? "";

  const agregar = (t: number) => {
    if (tallasCubiertas.has(t)) return;
    items.push({
      talla: t,
      tipoPrenda: tipoPrendaDefault,
      cantidad: 1,
      esPedidoCliente: false,
      clienteNombre: null,
      orden: orden++,
    });
    tallasCubiertas.add(t);
    metrajeUsado += consumoDe(t);
  };

  // 2. Filas sugeridas (no resaltadas).
  if (telaGrande) {
    // Tanda completa 0-10, sin analizar presupuesto.
    for (const t of TALLAS) agregar(t);
    return items;
  }

  // Poca tela: prioritarias (se agregan siempre) vs secundarias (si sobra tela).
  const agotadas = new Set<number>(); // talla que EXISTE en catálogo con stock 0
  const bajas = new Set<number>(); // 0 < stock <= umbral
  let hayNueva = false;

  for (const p of pedidos) {
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

  const baseNueva = hayNueva ? [0, 1, 2, 3, 4] : [];
  const medianasNueva = hayNueva ? [5, 6] : []; // máx 2 medianas

  const prioridad = [...new Set([...agotadas, ...baseNueva])].sort(
    (a, b) => a - b
  );
  const secundaria = [...new Set([...bajas, ...medianasNueva])].sort(
    (a, b) => a - b
  );

  // Prioritarias: agotadas y base chica, siempre.
  for (const t of prioridad) agregar(t);

  // Secundarias: bajas y medianas, solo si el metraje alcanza.
  for (const t of secundaria) {
    if (tallasCubiertas.has(t)) continue;
    if (metrajeUsado + consumoDe(t) > metrajeMetros) continue;
    agregar(t);
  }

  return items;
}

function modaTipoPrenda(pedidos: PedidoPendiente[]): string | null {
  const cuenta = new Map<string, number>();
  for (const p of pedidos) {
    const t = (p.tipoPrenda ?? "").trim();
    if (t) cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [t, n] of cuenta) {
    if (n > max) {
      max = n;
      best = t;
    }
  }
  return best;
}
