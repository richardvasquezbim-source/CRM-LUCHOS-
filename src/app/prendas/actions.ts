"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { prendaSchema, type PrendaFormState } from "@/lib/validations/prenda";
import {
  getEstadoFabricacion,
  getEstadoPago,
  type EstadoFabricacionKey,
  type EstadoPagoKey,
} from "@/lib/estados";

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

export async function archivarPrenda(id: string) {
  await prisma.prenda.update({ where: { id }, data: { archivedAt: new Date() } });
  revalidatePath("/");
}

export async function restaurarPrenda(id: string) {
  await prisma.prenda.update({ where: { id }, data: { archivedAt: null } });
  revalidatePath("/");
}

/**
 * Borrado DEFINITIVO de todo lo que está en la papelera. No hay vuelta atrás:
 * solo toca prendas con `archivedAt`, nunca las activas.
 */
export async function vaciarPapelera(): Promise<{ eliminadas: number }> {
  const { count } = await prisma.prenda.deleteMany({
    where: { archivedAt: { not: null } },
  });
  revalidatePath("/");
  return { eliminadas: count };
}

function formatFechaExcel(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "";
}

type PrendaConProveedor = Awaited<
  ReturnType<typeof prisma.prenda.findMany<{ include: { proveedor: true } }>>
>[number];

function filaPrendaExcel(p: PrendaConProveedor) {
  return {
    Cliente: p.clienteNombre,
    Contacto: p.contacto ?? "",
    "Diseño / Tela": p.disenoTela,
    Talla: p.talla ?? "",
    Tipo: p.tipoPrenda,
    Proveedor: p.proveedor.nombre,
    Fabricación: getEstadoFabricacion(p.estadoFabricacion).label,
    Pago: getEstadoPago(p.estadoPago).label,
    "Fecha compra": formatFechaExcel(p.fechaCompra),
    "Fecha entrega solicitada": formatFechaExcel(p.fechaEntregaSolicitada),
    "Fecha envío real": formatFechaExcel(p.fechaEnvioReal),
    Monto: p.montoPagado ?? "",
    "Fecha de registro": formatFechaExcel(p.createdAt),
    Nota: p.nota ?? "",
  };
}

export async function exportarRespaldo(): Promise<{
  base64: string;
  filename: string;
}> {
  const [prendas, proveedores] = await Promise.all([
    prisma.prenda.findMany({
      include: { proveedor: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  // Las archivadas van en su propia hoja: así la hoja "Prendas" queda solo
  // con lo vigente, sin perder el respaldo de lo que está en la papelera.
  const prendasRows = prendas
    .filter((p) => !p.archivedAt)
    .map((p) => filaPrendaExcel(p));

  const papeleraRows = prendas
    .filter((p) => p.archivedAt)
    .map((p) => ({
      ...filaPrendaExcel(p),
      "Fecha archivado": formatFechaExcel(p.archivedAt),
    }));

  const proveedoresRows = proveedores.map((p) => ({
    Nombre: p.nombre,
    Activo: p.activo ? "Sí" : "No",
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(prendasRows),
    "Prendas"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(proveedoresRows),
    "Proveedores"
  );
  if (papeleraRows.length > 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(papeleraRows),
      "Papelera"
    );
  }

  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  const filename = `respaldo-crm-petshop-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return { base64, filename };
}
