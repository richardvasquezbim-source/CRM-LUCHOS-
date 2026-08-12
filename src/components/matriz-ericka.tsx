// Muestra los items como matriz: tallas en filas, un tipo de prenda por
// columna, la cantidad en cada celda. Las celdas de pedido de cliente van en
// amarillo y el nombre del cliente aparece a la derecha. Solo lectura.
// Componente presentacional (sin hooks): sirve en server y client.

type ItemMatriz = {
  talla: number;
  tipoPrenda: string;
  cantidad: number;
  esPedidoCliente: boolean;
  clienteNombre: string | null;
};

const SIN_TIPO = "(sin tipo)";

export function tiposDeItems(items: ItemMatriz[]): string[] {
  return [
    ...new Set(items.map((i) => i.tipoPrenda.trim() || SIN_TIPO)),
  ].sort((a, b) => a.localeCompare(b, "es"));
}

export function MatrizEricka({ items }: { items: ItemMatriz[] }) {
  const tipos = tiposDeItems(items);
  const tallas = [...new Set(items.map((i) => i.talla))].sort((a, b) => a - b);
  const mapa = new Map<string, ItemMatriz>();
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

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
        La tabla está vacía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-1.5 font-medium">Talla</th>
            {tipos.map((t) => (
              <th key={t} className="px-3 py-1.5 text-center font-medium">
                {t}
              </th>
            ))}
            <th className="px-3 py-1.5 font-medium">Cliente</th>
          </tr>
        </thead>
        <tbody>
          {tallas.map((talla) => (
            <tr key={talla} className="border-b">
              <td className="px-3 py-1.5 font-medium">{talla}</td>
              {tipos.map((tipo) => {
                const it = mapa.get(`${talla}|${tipo}`);
                return (
                  <td
                    key={tipo}
                    className={
                      "px-3 py-1.5 text-center " +
                      (it?.esPedidoCliente
                        ? "bg-amber-100 font-medium dark:bg-amber-950"
                        : "")
                    }
                  >
                    {it ? it.cantidad : ""}
                  </td>
                );
              })}
              <td className="px-3 py-1.5 text-muted-foreground">
                {clientesDe(talla) || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
