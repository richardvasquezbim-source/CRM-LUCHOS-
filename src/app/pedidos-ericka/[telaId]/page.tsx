import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PedidoErickaView } from "@/components/pedido-ericka-view";

export default async function PedidoErickaPage({
  params,
}: {
  params: Promise<{ telaId: string }>;
}) {
  const { telaId } = await params;

  const tela = await prisma.tela.findUnique({ where: { id: telaId } });
  if (!tela) notFound();

  const [pedido, pendientes] = await Promise.all([
    prisma.pedidoEricka.findFirst({
      where: { telaId },
      orderBy: { generadoEn: "desc" },
      include: { items: { orderBy: { orden: "asc" } } },
    }),
    prisma.prenda.count({
      where: {
        telaId,
        archivedAt: null,
        estadoFabricacion: { not: "enviado" },
      },
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <PedidoErickaView
        key={`${pedido?.id ?? "none"}-${pedido?.estado ?? ""}`}
        tela={{
          id: tela.id,
          nombre: tela.nombre,
          metrajeDisponible: tela.metrajeDisponible,
          unidad: tela.unidad,
          estado: tela.estado,
        }}
        pedido={pedido}
        pendientes={pendientes}
      />
    </main>
  );
}
