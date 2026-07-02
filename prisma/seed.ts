import "dotenv/config";
import path from "node:path";
import * as XLSX from "xlsx";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { ESTADO_FABRICACION_KEYS, type EstadoFabricacionKey } from "../src/lib/estados";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EXCEL_PATH = path.join(__dirname, "..", "CONTROL_CLIENTES.xlsx");
const SHEET_NAME = "Base de datos";
const ESTADO_PAGO_IMPORTADO = "falta_pago";

const PROVEEDORES_INICIALES = [
  { nombre: "Ericka", activo: true },
  { nombre: "Nathaly", activo: true },
  { nombre: "Cristina", activo: true },
  { nombre: "Bony", activo: false },
];

const ESTADO_FABRICACION_LABELS: Record<EstadoFabricacionKey, string> = {
  compra_tela_pendiente: "compra de tela pendiente",
  tela_entregada: "tela entregada - en confección",
  confeccionado: "confeccionado - pendiente de recojo",
  listo_envio: "listo para envío",
  enviado: "enviado",
};

function mapEstadoFabricacion(texto: string | null): EstadoFabricacionKey | null {
  if (!texto) return null;
  const normalizado = texto.trim().toLowerCase();
  for (const key of ESTADO_FABRICACION_KEYS) {
    if (ESTADO_FABRICACION_LABELS[key] === normalizado) return key;
  }
  return null;
}

function parseFechaDDMMYYYY(texto: string | null): Date | null {
  if (!texto) return null;
  const match = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function main() {
  const existentes = await prisma.prenda.count();
  if (existentes > 0) {
    console.error(
      `La tabla Prenda ya tiene ${existentes} filas. Este script se corre una sola vez ` +
        `contra una base recién migrada; abortando para no duplicar datos.`
    );
    process.exit(1);
  }

  const proveedorPorNombre = new Map<string, { id: string }>();
  for (const p of PROVEEDORES_INICIALES) {
    const proveedor = await prisma.proveedor.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: p,
    });
    proveedorPorNombre.set(p.nombre.toLowerCase(), proveedor);
  }

  async function resolverProveedor(nombreCrudo: string) {
    const nombre = nombreCrudo.trim();
    const existente = proveedorPorNombre.get(nombre.toLowerCase());
    if (existente) return existente;
    const creado = await prisma.proveedor.create({
      data: { nombre, activo: true },
    });
    proveedorPorNombre.set(nombre.toLowerCase(), creado);
    return creado;
  }

  const workbook = XLSX.readFile(EXCEL_PATH, { cellDates: true });
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`No se encontró la hoja "${SHEET_NAME}" en ${EXCEL_PATH}`);
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  let importadas = 0;
  let omitidas = 0;

  // fila 0 = titulo, fila 1 = encabezado, datos desde fila 2
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] as (string | null)[];
    const hasData = row.some((c) => c !== null && String(c).trim() !== "");
    if (!hasData) continue;

    const [
      ,
      clienteNombre,
      tela,
      talla,
      tipoPrenda,
      proveedorNombre,
      estadoTexto,
      fechaEntregaTexto,
      ,
      nota,
    ] = row;

    if (!clienteNombre || !tela || !tipoPrenda || !proveedorNombre || !estadoTexto) {
      console.warn(`Fila ${i + 1}: datos incompletos, se omite.`, row);
      omitidas++;
      continue;
    }

    const estadoFabricacion = mapEstadoFabricacion(estadoTexto);
    if (!estadoFabricacion) {
      console.warn(
        `Fila ${i + 1}: estado "${estadoTexto}" no reconocido, se omite para revisión manual.`
      );
      omitidas++;
      continue;
    }

    const proveedor = await resolverProveedor(proveedorNombre);

    await prisma.prenda.create({
      data: {
        clienteNombre: clienteNombre.trim(),
        disenoTela: tela.trim(),
        talla: talla ? talla.trim() : null,
        tipoPrenda: tipoPrenda.trim(),
        proveedorId: proveedor.id,
        estadoFabricacion,
        estadoPago: ESTADO_PAGO_IMPORTADO,
        fechaEntregaSolicitada: parseFechaDDMMYYYY(fechaEntregaTexto),
        nota: nota ? nota.trim() : null,
      },
    });
    importadas++;
  }

  console.log(`Import terminado: ${importadas} prendas creadas, ${omitidas} filas omitidas.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
