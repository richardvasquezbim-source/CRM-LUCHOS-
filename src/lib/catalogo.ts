import { prisma } from "@/lib/prisma";

export type CatalogoModelo = {
  grupo: string;
  label: string;
};

/**
 * Modelos del catálogo (tabla `productos`, compartida en la misma base de
 * datos — ver memoria del proyecto). Un "modelo" = un `grupo` (abarca varias
 * tallas). Se lee por SQL crudo porque esas tablas no las maneja Prisma.
 * La etiqueta legible se arma con tipo · diseño · color; el `grupo` (nombre
 * de archivo) es solo el identificador interno.
 */
export async function getCatalogoModelos(): Promise<CatalogoModelo[]> {
  const rows = await prisma.$queryRawUnsafe<
    { grupo: string; tipo: string | null; diseno: string | null; color: string | null }[]
  >(
    `select distinct on (grupo) grupo, tipo, diseno, color
     from productos
     where grupo is not null
     order by grupo, id`
  );

  return rows
    .map((r) => {
      const partes = [r.tipo, r.diseno, r.color].filter(
        (x) => x && String(x).trim()
      );
      return {
        grupo: r.grupo,
        label: partes.length > 0 ? partes.join(" · ") : r.grupo,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/**
 * Stock por talla de un modelo del catálogo (para la reposición). Devuelve
 * un mapa talla(0-10) → cantidad. Solo lectura.
 */
export async function getStockPorTalla(
  grupo: string
): Promise<Record<number, number>> {
  const rows = await prisma.$queryRawUnsafe<{ talla_id: number; cantidad: number }[]>(
    `select ps.talla_id, ps.cantidad
     from productos p
     join producto_stock ps on ps.producto_id = p.id
     where p.grupo = $1`,
    grupo
  );
  const mapa: Record<number, number> = {};
  for (const r of rows) mapa[r.talla_id] = r.cantidad;
  return mapa;
}
