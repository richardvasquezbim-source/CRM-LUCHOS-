"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  pedidoSchema,
  type PedidoFormState,
} from "@/lib/validations/pedido";
import type { EstadoKey } from "@/lib/estados";

export async function createPedido(
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const parsed = pedidoSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.pedido.create({ data: parsed.data });
  revalidatePath("/");
  return { errors: {}, success: true };
}

export async function updatePedido(
  id: string,
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const parsed = pedidoSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.pedido.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  return { errors: {}, success: true };
}

export async function updateEstado(id: string, estado: EstadoKey) {
  await prisma.pedido.update({ where: { id }, data: { estado } });
  revalidatePath("/");
}
