import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.pedido.createMany({
    data: [
      {
        clienteNombre: "Maria Gomez",
        contacto: "555-0101",
        modelo: "Sueter azul talla M",
        estado: "interesado",
        nota: "Pregunto por tallas disponibles",
      },
      {
        clienteNombre: "Juan Perez",
        contacto: "555-0102",
        modelo: "Arnes reflectivo talla L",
        estado: "falta_pago",
        montoPagado: 0,
      },
      {
        clienteNombre: "Ana Torres",
        contacto: "555-0103",
        modelo: "Capa de lluvia talla S",
        estado: "enviar_hoy",
        montoPagado: 250,
        fechaSolicitada: new Date(),
      },
      {
        clienteNombre: "Carlos Ruiz",
        contacto: "555-0104",
        modelo: "Collar bordado talla unica",
        estado: "enviado",
        montoPagado: 180,
        fechaEnvioReal: new Date(),
      },
    ],
  });
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
