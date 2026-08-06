import { prisma } from "@/lib/prisma";
import { TelasView } from "@/components/telas-view";

export default async function TelasPage() {
  const telas = await prisma.tela.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto flex max-w-[1800px] flex-col gap-4 p-6">
      <TelasView telas={telas} />
    </main>
  );
}
