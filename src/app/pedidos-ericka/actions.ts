"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStockPorTalla } from "@/lib/catalogo";
import {
  generarItems,
  KG_A_METROS,
  type PedidoPendiente,
} from "@/lib/generador-ericka";

// Un pedido "pendiente" de mandar a Ericka = vinculado a la tela, activo y
// todavía en "compra de tela pendiente" (aún no se le entregó tela).
const ESTADO_PENDIENTE = "compra_tela_pendiente";

type ItemEntrada = {
  talla: number;
  tipoPrenda: string;
  cantidad: number;
  clienteNombre: string | null;
};

async function mapaConsumo(): Promise<Record<number, number>> {
  const rows = await prisma.consumoTalla.findMany();
  const mapa: Record<number, number> = {};
  for (const c of rows) mapa[c.talla] = c.metros;
  return mapa;
}

export async function generarPedidoEricka(telaId: string) {
  const tela = await prisma.tela.findUnique({ where: { id: telaId } });
  if (!tela) return;

  const prendas = await prisma.prenda.findMany({
    where: { telaId, archivedAt: null, estadoFabricacion: ESTADO_PENDIENTE },
    select: {
      clienteNombre: true,
      tipoPrenda: true,
      tipoPedido: true,
      catalogoGrupo: true,
      tallaNumero: true,
    },
  });

  const pedidos: PedidoPendiente[] = prendas.map((p) => ({
    clienteNombre: p.clienteNombre,
    tipoPrenda: p.tipoPrenda,
    tipoPedido: p.tipoPedido,
    catalogoGrupo: p.catalogoGrupo,
    tallaNumero: p.tallaNumero,
  }));

  const consumo = await mapaConsumo();

  const grupos = [
    ...new Set(
      prendas
        .filter((p) => p.tipoPedido === "reposicion" && p.catalogoGrupo)
        .map((p) => p.catalogoGrupo as string)
    ),
  ];
  const stockPorGrupo: Record<string, Record<number, number>> = {};
  for (const g of grupos) stockPorGrupo[g] = await getStockPorTalla(g);

  const items = generarItems({
    metrajeDisponible: tela.metrajeDisponible,
    unidad: tela.unidad,
    pedidos,
    consumo,
    stockPorGrupo,
  });

  // Reemplaza cualquier borrador anterior de esta tela (las filas caen en
  // cascada). Los pedidos ya "enviado" se conservan como historial.
  await prisma.pedidoEricka.deleteMany({ where: { telaId, estado: "borrador" } });
  await prisma.pedidoEricka.create({
    data: {
      telaId,
      items: {
        create: items.map((i) => ({
          talla: i.talla,
          tipoPrenda: i.tipoPrenda,
          cantidad: i.cantidad,
          esPedidoCliente: i.esPedidoCliente,
          clienteNombre: i.clienteNombre,
          orden: i.orden,
        })),
      },
    },
  });

  revalidatePath(`/pedidos-ericka/${telaId}`);
}

export async function guardarItemsEricka(
  pedidoId: string,
  items: ItemEntrada[]
) {
  const pedido = await prisma.pedidoEricka.findUnique({
    where: { id: pedidoId },
    select: { telaId: true, estado: true },
  });
  if (!pedido || pedido.estado !== "borrador") return;

  const limpios = items
    .map((i, idx) => {
      const talla = Math.max(0, Math.min(10, Math.round(Number(i.talla) || 0)));
      const cantidad = Math.max(1, Math.round(Number(i.cantidad) || 1));
      const cliente = (i.clienteNombre ?? "").trim();
      return {
        pedidoErickaId: pedidoId,
        talla,
        tipoPrenda: (i.tipoPrenda ?? "").trim(),
        cantidad,
        esPedidoCliente: cliente.length > 0,
        clienteNombre: cliente || null,
        orden: idx,
      };
    })
    .filter((i) => i.tipoPrenda.length > 0 || i.clienteNombre);

  await prisma.pedidoErickaItem.deleteMany({
    where: { pedidoErickaId: pedidoId },
  });
  if (limpios.length > 0) {
    await prisma.pedidoErickaItem.createMany({ data: limpios });
  }

  revalidatePath(`/pedidos-ericka/${pedido.telaId}`);
}

export async function marcarPedidoEnviado(pedidoId: string) {
  const pedido = await prisma.pedidoEricka.findUnique({
    where: { id: pedidoId },
    include: { items: true, tela: true },
  });
  if (!pedido || pedido.estado !== "borrador") return;

  const consumo = await mapaConsumo();
  let metrosUsados = 0;
  for (const it of pedido.items) {
    metrosUsados += (consumo[it.talla] ?? 0) * it.cantidad;
  }
  // Descontar en la unidad en que se guarda el metraje de la tela.
  const descuento =
    pedido.tela.unidad === "kg" ? metrosUsados / KG_A_METROS : metrosUsados;
  const nuevoMetraje = Math.max(
    0,
    Number((pedido.tela.metrajeDisponible - descuento).toFixed(3))
  );

  await prisma.$transaction([
    prisma.pedidoEricka.update({
      where: { id: pedidoId },
      data: { estado: "enviado", enviadoEn: new Date() },
    }),
    prisma.tela.update({
      where: { id: pedido.telaId },
      data: {
        metrajeDisponible: nuevoMetraje,
        estado: nuevoMetraje <= 0 ? "agotada" : undefined,
      },
    }),
  ]);

  revalidatePath(`/pedidos-ericka/${pedido.telaId}`);
  revalidatePath("/telas");
}

export async function eliminarPedidoEricka(pedidoId: string) {
  const pedido = await prisma.pedidoEricka.findUnique({
    where: { id: pedidoId },
    select: { telaId: true },
  });
  if (!pedido) return;
  await prisma.pedidoEricka.delete({ where: { id: pedidoId } });
  revalidatePath(`/pedidos-ericka/${pedido.telaId}`);
}
