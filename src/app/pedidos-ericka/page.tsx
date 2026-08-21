import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerarPedidoBoton } from "@/components/generar-pedido-boton";
import { MatrizEricka } from "@/components/matriz-ericka";
import { CopiarBoton } from "@/components/copiar-boton";
import { matrizTelaATSV } from "@/lib/exportar-tsv";
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
    where: {
      archivedAt: null,
      estadoFabricacion: { not: "enviado" },
      telaId: { not: null },
    },
    _count: { _all: true },
  });
  for (const c of conteos) {
    if (c.telaId) pendientesPorTela.set(c.telaId, c._count._all);
  }

  // Los pedidos ya enviados a Ericka pasan a un historial aparte; la lista
  // principal muestra solo lo que sigue en preparación (borrador o sin generar).
  const activas = telas.filter(
    (t) => (t.pedidosEricka[0]?.estado ?? "borrador") !== "enviado"
  );
  const enviadas = telas.filter(
    (t) => t.pedidosEricka[0]?.estado === "enviado"
  );

  // "Copiar todo" solo junta los borradores activos (no lo ya enviado).
  const tsvTodo = activas
    .filter((t) => t.pedidosEricka[0])
    .map((t) =>
      matrizTelaATSV(
        t.nombre,
        cantidadTela(t.metrajeDisponible, t.unidad),
        t.pedidosEricka[0].items
      )
    )
    .join("\n\n");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" render={<Link href="/" />}>
          <ArrowLeftIcon /> Prendas
        </Button>
        <h1 className="text-2xl font-semibold">Producción · Pedidos para Ericka</h1>
        {tsvTodo && (
          <div className="ml-auto">
            <CopiarBoton
              texto={tsvTodo}
              label="Copiar todo para Sheets"
              size="default"
            />
          </div>
        )}
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

      {activas.map((tela) => {
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
              {pedido && (
                <CopiarBoton
                  texto={matrizTelaATSV(
                    tela.nombre,
                    cantidadTela(tela.metrajeDisponible, tela.unidad),
                    pedido.items
                  )}
                  label="Copiar"
                />
              )}
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

      {enviadas.length > 0 && (
        <section className="flex flex-col gap-2 border-t pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Historial de enviados
          </h2>
          {enviadas.map((tela) => {
            const pedido = tela.pedidosEricka[0];
            return (
              <div
                key={tela.id}
                className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
              >
                <div className="mr-auto text-sm">
                  <span className="font-medium">{tela.nombre}</span>{" "}
                  <span className="text-muted-foreground">
                    · {cantidadTela(tela.metrajeDisponible, tela.unidad)} ·
                    enviado el {formatMarcaTiempo(pedido.enviadoEn)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/pedidos-ericka/${tela.id}`} />}
                >
                  Ver
                </Button>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
