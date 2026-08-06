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

export async function eliminarTela(id: string) {
  await prisma.tela.delete({ where: { id } });
  revalidatePath("/telas");
}
