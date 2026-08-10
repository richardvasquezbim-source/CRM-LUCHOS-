import { prisma } from "@/lib/prisma";
import { PrendasView } from "@/components/prendas-view";
import { getCatalogoModelos } from "@/lib/catalogo";

export default async function Home() {
  const [prendas, prendasArchivadas, proveedores, telas, catalogoModelos] =
    await Promise.all([
      prisma.prenda.findMany({
        where: { archivedAt: null },
        include: { proveedor: true, tela: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prenda.findMany({
        where: { archivedAt: { not: null } },
        include: { proveedor: true, tela: true },
        orderBy: { archivedAt: "desc" },
      }),
      prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
      prisma.tela.findMany({ orderBy: { nombre: "asc" } }),
      getCatalogoModelos(),
    ]);

  return (
    // Ancho generoso: la tabla tiene muchas columnas y con 7xl (1280px)
    // quedaban varias fuera de la vista en pantallas grandes.
    <main className="mx-auto flex max-w-[1800px] flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Prendas</h1>
      <PrendasView
        prendas={prendas}
        prendasArchivadas={prendasArchivadas}
        proveedores={proveedores}
        telas={telas}
        catalogoModelos={catalogoModelos}
      />
    </main>
  );
}
