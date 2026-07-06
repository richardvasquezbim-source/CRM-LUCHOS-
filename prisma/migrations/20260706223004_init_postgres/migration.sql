-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prenda" (
    "id" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "contacto" TEXT,
    "disenoTela" TEXT NOT NULL,
    "talla" TEXT,
    "tipoPrenda" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "estadoFabricacion" TEXT NOT NULL DEFAULT 'compra_tela_pendiente',
    "estadoPago" TEXT NOT NULL DEFAULT 'interesado',
    "fechaCompra" TIMESTAMP(3),
    "fechaEntregaSolicitada" TIMESTAMP(3),
    "fechaEnvioReal" TIMESTAMP(3),
    "montoPagado" DOUBLE PRECISION,
    "nota" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

-- AddForeignKey
ALTER TABLE "Prenda" ADD CONSTRAINT "Prenda_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
