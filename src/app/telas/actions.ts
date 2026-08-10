"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { telaSchema, type TelaFormState } from "@/lib/validations/tela";

export async function createTela(
  _prevState: TelaFormState,
  formData: FormData
): Promise<TelaFormState> {
  const parsed = telaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  await prisma.tela.create({ data: parsed.data });
  revalidatePath("/telas");
  return { errors: {}, success: true };
}

export async function updateTela(
  id: string,
  _prevState: TelaFormState,
  formData: FormData
): Promise<TelaFormState> {
  const parsed = telaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  await prisma.tela.update({ where: { id }, data: parsed.data });
  revalidatePath("/telas");
  return { errors: {}, success: true };
}

export async function eliminarTela(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const vinculadas = await prisma.prenda.count({ where: { telaId: id } });
  if (vinculadas > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: hay ${vinculadas} ${
        vinculadas === 1 ? "pedido vinculado" : "pedidos vinculados"
      } a esta tela.`,
    };
  }
  await prisma.tela.delete({ where: { id } });
  revalidatePath("/telas");
  return { ok: true };
}
