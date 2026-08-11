-- Fase 3 del pedido a Ericka: borradores generados + sus filas editables.
-- Cambio aditivo: solo crea tablas nuevas y sus llaves foráneas.

-- CreateTable
CREATE TABLE "PedidoEricka" (
    "id" TEXT NOT NULL,
    "telaId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEn" TIMESTAMP(3),

    CONSTRAINT "PedidoEricka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoErickaItem" (
    "id" TEXT NOT NULL,
    "pedidoErickaId" TEXT NOT NULL,
    "talla" INTEGER NOT NULL,
    "tipoPrenda" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "esPedidoCliente" BOOLEAN NOT NULL DEFAULT false,
    "clienteNombre" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PedidoErickaItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PedidoEricka" ADD CONSTRAINT "PedidoEricka_telaId_fkey"
  FOREIGN KEY ("telaId") REFERENCES "Tela"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoErickaItem" ADD CONSTRAINT "PedidoErickaItem_pedidoErickaId_fkey"
  FOREIGN KEY ("pedidoErickaId") REFERENCES "PedidoEricka"("id") ON DELETE CASCADE ON UPDATE CASCADE;
