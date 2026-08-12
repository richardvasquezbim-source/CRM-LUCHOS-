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
  // Ahora una talla puede aparecer para varios tipos de prenda; la clave de
  // "ya cubierta" es talla + tipo (una celda de la matriz).
  const cubiertas = new Set<string>();
  const clave = (t: number, tipo: string) => `${t}|${tipo}`;
  let orden = 0;
  let metrajeUsado = 0;

  const agregar = (t: number, tipo: string) => {
    if (cubiertas.has(clave(t, tipo))) return;
    items.push({
      talla: t,
      tipoPrenda: tipo,
      cantidad: 1,
      esPedidoCliente: false,
      clienteNombre: null,
      orden: orden++,
    });
    cubiertas.add(clave(t, tipo));
    metrajeUsado += consumoDe(t);
  };

  // 1. Filas de cliente (resaltadas): los pedidos reales con talla numérica.
  const pedidosOrdenados = [...pedidos]
    .filter((p) => p.tallaNumero !== null)
    .sort((a, b) => (a.tallaNumero as number) - (b.tallaNumero as number));

  for (const p of pedidosOrdenados) {
    const t = p.tallaNumero as number;
    const tipoCanon = canonical(p.tipoPrenda);
    items.push({
      talla: t,
      tipoPrenda: tipoCanon,
      cantidad: 1,
      esPedidoCliente: true,
      clienteNombre: p.clienteNombre,
      orden: orden++,
    });
    cubiertas.add(clave(t, tipoCanon));
    metrajeUsado += consumoDe(t);
  }

  // 2. Sugerencias POR TIPO DE PRENDA: de una misma tela pueden salir varias
  // prendas (Polera, Pijama…), y cada una lleva su propia tanda de tallas.
  const tipos = [
    ...new Set(pedidos.map((p) => canonical(p.tipoPrenda)).filter(Boolean)),
  ];
  // Sin pedidos: una columna en blanco para que el usuario ponga el tipo.
  if (tipos.length === 0) tipos.push("");

  const prioridadPorTipo = new Map<string, number[]>();
  const secundariaPorTipo = new Map<string, number[]>();

  for (const tipo of tipos) {
    if (telaGrande) {
      prioridadPorTipo.set(tipo, [...TALLAS]); // tanda completa 0-10
      secundariaPorTipo.set(tipo, []);
      continue;
    }
    const pedidosTipo = pedidos.filter((p) => canonical(p.tipoPrenda) === tipo);
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
    const baseNueva = hayNueva ? [0, 1, 2, 3, 4] : [];
    const medianasNueva = hayNueva ? [5, 6] : []; // máx 2 medianas
    prioridadPorTipo.set(
      tipo,
      [...new Set([...agotadas, ...baseNueva])].sort((a, b) => a - b)
    );
    secundariaPorTipo.set(
      tipo,
      [...new Set([...bajas, ...medianasNueva])].sort((a, b) => a - b)
    );
  }

  // Prioritarias de todos los tipos: se agregan siempre.
  for (const tipo of tipos) {
    for (const t of prioridadPorTipo.get(tipo) ?? []) agregar(t, tipo);
  }
  // Secundarias: solo mientras el metraje alcance (presupuesto compartido).
  for (const tipo of tipos) {
    for (const t of secundariaPorTipo.get(tipo) ?? []) {
      if (cubiertas.has(clave(t, tipo))) continue;
      if (metrajeUsado + consumoDe(t) > metrajeMetros) continue;
      agregar(t, tipo);
    }
  }

  return items;
}
