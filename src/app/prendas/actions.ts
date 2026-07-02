"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prendaSchema, type PrendaFormState } from "@/lib/validations/prenda";
import type { EstadoFabricacionKey, EstadoPagoKey } from "@/lib/estados";

export async function createPrenda(
  _prevState: PrendaFormState,
  formData: FormData
): Promise<PrendaFormState> {
  const parsed = prendaSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.prenda.create({ data: parsed.data });
  revalidatePath("/");
  return { errors: {}, success: true };
}

export async function updatePrenda(
  id: string,
  _prevState: PrendaFormState,
  formData: FormData
): Promise<PrendaFormState> {
  const parsed = prendaSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.prenda.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  return { errors: {}, success: true };
}

export async function updateEstadoFabricacion(
  id: string,
  estadoFabricacion: EstadoFabricacionKey
) {
  await prisma.prenda.update({ where: { id }, data: { estadoFabricacion } });
  revalidatePath("/");
}

export async function updateEstadoPago(id: string, estadoPago: EstadoPagoKey) {
  await prisma.prenda.update({ where: { id }, data: { estadoPago } });
  revalidatePath("/");
}

export async function createProveedor(
  nombre: string
): Promise<{ error: string } | { error?: undefined; id: string }> {
  const trimmed = nombre.trim();
  if (!trimmed) return { error: "El nombre no puede estar vacío" };

  const existing = await prisma.proveedor.findUnique({
    where: { nombre: trimmed },
  });
  if (existing) return { error: "Ya existe un proveedor con ese nombre" };

  const proveedor = await prisma.proveedor.create({ data: { nombre: trimmed } });
  revalidatePath("/");
  return { id: proveedor.id };
}

export async function setProveedorActivo(id: string, activo: boolean) {
  await prisma.proveedor.update({ where: { id }, data: { activo } });
  revalidatePath("/");
}
