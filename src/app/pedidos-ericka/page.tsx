import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerarPedidoBoton } from "@/components/generar-pedido-boton";
import { MatrizEricka } from "@/components/matriz-ericka";
import { formatMarcaTiempo } from "@/lib/alerta";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

function cantidadTela(metraje: number, unidad: string) {
  return `${metraje} ${unidad === "kg" ? "kg" : "m"}`;
}

export default async function ProduccionPage() {
  const telas = await prisma.tela.findMany({
    orderBy: [{ estado: "asc" }, { nombre: "asc" }],
    include: {
      pedidosEricka: {
        orderBy: { generadoEn: "desc" },
        take: 1,
        include: { items: { orderBy: { orden: "asc" } } },
      },
    },
  });

  // Pedidos pendientes por tela (para telas aún sin generar).
  const pendientesPorTela = new Map<string, number>();
  const conteos = await prisma.prenda.groupBy({
    by: ["telaId"],
    where: { archivedAt: null, estadoFabricacion: "compra_tela_pendiente", telaId: { not: null } },
    _count: { _all: true },
  });
  for (const c of conteos) {
    if (c.telaId) pendientesPorTela.set(c.telaId, c._count._all);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" render={<Link href="/" />}>
          <ArrowLeftIcon /> Prendas
        </Button>
        <h1 className="text-2xl font-semibold">Producción · Pedidos para Ericka</h1>
      </div>

      {telas.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          Aún no hay telas registradas. Agregá telas en la sección{" "}
          <Link href="/telas" className="underline">
            Telas
          </Link>
          .
        </p>
      )}

      {telas.map((tela) => {
        const pedido = tela.pedidosEricka[0] ?? null;
        const pendientes = pendientesPorTela.get(tela.id) ?? 0;
        return (
          <section key={tela.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto">
                <h2 className="font-medium">
                  {tela.nombre}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {cantidadTela(tela.metrajeDisponible, tela.unidad)}
                  </span>
                </h2>
                {pedido && (
                  <p className="text-xs text-muted-foreground">
                    {pedido.estado === "enviado"
                      ? `Enviado el ${formatMarcaTiempo(pedido.enviadoEn)}`
                      : `Borrador · generado ${formatMarcaTiempo(pedido.generadoEn)}`}
                  </p>
                )}
              </div>
              {pedido && (
                <Badge
                  variant="outline"
                  className={
                    pedido.estado === "enviado"
                      ? "border-green-200 bg-green-100 text-green-800"
                      : "border-amber-200 bg-amber-100 text-amber-800"
                  }
                >
                  {pedido.estado === "enviado" ? "Enviado" : "Borrador"}
                </Badge>
              )}
              <GenerarPedidoBoton
                telaId={tela.id}
                label={pedido ? "Regenerar" : "Generar"}
                confirmar={!!pedido}
              />
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/pedidos-ericka/${tela.id}`} />}
              >
                <PencilIcon /> Abrir
              </Button>
            </div>

            {pedido ? (
              <MatrizEricka items={pedido.items} />
            ) : (
              <p className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                Sin generar.{" "}
                {pendientes > 0
                  ? `${pendientes} ${pendientes === 1 ? "pedido pendiente" : "pedidos pendientes"}.`
                  : "No hay pedidos pendientes vinculados."}
              </p>
            )}
          </section>
        );
      })}
    </main>
  );
}
