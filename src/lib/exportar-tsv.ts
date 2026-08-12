// Arma texto separado por TABULACIONES (TSV). Al copiarlo y pegarlo en Google
// Sheets / Excel, cada valor cae en su propia celda (tab = columna, salto de
// línea = fila). Sin acentos ni símbolos que estorben al número.

import { formatFechaSoloDia } from "@/lib/alerta";

const SIN_TIPO = "(sin tipo)";

type ItemTsv = {
  talla: number;
  tipoPrenda: string;
  cantidad: number;
  esPedidoCliente: boolean;
  clienteNombre: string | null;
};

type TelaTsv = {
  nombre: string;
  metrajeDisponible: number;
  unidad: string;
  costoPorMetro: number | null;
  costoTotal: number | null;
  fechaCompra: Date | null;
  fechaEnvio: Date | null;
  estado: string;
};

function fila(campos: (string | number)[]) {
  return campos.map((c) => String(c ?? "")).join("\t");
}

export function telasATSV(telas: TelaTsv[]): string {
  const encabezado = fila([
    "Tela",
    "Cantidad",
    "Unidad",
    "Costo x metro",
    "Costo total",
    "Compra",
    "Envio",
    "Estado",
  ]);
  const filas = telas.map((t) =>
    fila([
      t.nombre,
      t.metrajeDisponible,
      t.unidad === "kg" ? "kg" : "m",
      t.costoPorMetro ?? "",
      t.costoTotal ?? "",
      formatFechaSoloDia(t.fechaCompra) ?? "",
      formatFechaSoloDia(t.fechaEnvio) ?? "",
      t.estado === "agotada" ? "Agotada" : "Disponible",
    ])
  );
  return [encabezado, ...filas].join("\n");
}

/** Matriz de una tela (tallas x tipo de prenda), con título y columna Cliente. */
export function matrizTelaATSV(
  telaNombre: string,
  cantidadTexto: string,
  items: ItemTsv[]
): string {
  const tipos = [
    ...new Set(items.map((i) => i.tipoPrenda.trim() || SIN_TIPO)),
  ].sort((a, b) => a.localeCompare(b, "es"));
  const tallas = [...new Set(items.map((i) => i.talla))].sort((a, b) => a - b);
  const mapa = new Map<string, ItemTsv>();
  for (const i of items) {
    mapa.set(`${i.talla}|${i.tipoPrenda.trim() || SIN_TIPO}`, i);
  }
  const clientesDe = (talla: number) =>
    [
      ...new Set(
        items
          .filter((i) => i.talla === talla && i.clienteNombre)
          .map((i) => i.clienteNombre as string)
      ),
    ].join(", ");

  const titulo = `${telaNombre} (${cantidadTexto})`;
  if (items.length === 0) return `${titulo}\n(sin tabla generada)`;

  const encabezado = fila(["Talla", ...tipos, "Cliente"]);
  const filas = tallas.map((talla) =>
    fila([
      talla,
      ...tipos.map((tipo) => {
        const it = mapa.get(`${talla}|${tipo}`);
        return it ? it.cantidad : "";
      }),
      clientesDe(talla),
    ])
  );
  return [titulo, encabezado, ...filas].join("\n");
}
