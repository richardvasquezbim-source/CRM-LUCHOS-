import { prisma } from "@/lib/prisma";
import { Board } from "@/components/board";

export default async function Home() {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Pedidos</h1>
      <Board pedidos={pedidos} />
    </main>
  );
}
