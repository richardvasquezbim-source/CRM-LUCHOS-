import { prisma } from "@/lib/prisma";
import { PrendasView } from "@/components/prendas-view";

export default async function Home() {
  const [prendas, proveedores] = await Promise.all([
    prisma.prenda.findMany({
      include: { proveedor: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Prendas</h1>
      <PrendasView prendas={prendas} proveedores={proveedores} />
    </main>
  );
}
