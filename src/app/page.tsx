import { prisma } from "@/lib/prisma";
import { PrendasView } from "@/components/prendas-view";

export default async function Home() {
  const [prendas, prendasArchivadas, proveedores] = await Promise.all([
    prisma.prenda.findMany({
      where: { archivedAt: null },
      include: { proveedor: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.prenda.findMany({
      where: { archivedAt: { not: null } },
      include: { proveedor: true },
      orderBy: { archivedAt: "desc" },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Prendas</h1>
      <PrendasView
        prendas={prendas}
        prendasArchivadas={prendasArchivadas}
        proveedores={proveedores}
      />
    </main>
  );
}
