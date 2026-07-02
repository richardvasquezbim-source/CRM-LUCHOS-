-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Prenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteNombre" TEXT NOT NULL,
    "contacto" TEXT,
    "disenoTela" TEXT NOT NULL,
    "talla" TEXT,
    "tipoPrenda" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "estadoFabricacion" TEXT NOT NULL DEFAULT 'compra_tela_pendiente',
    "estadoPago" TEXT NOT NULL DEFAULT 'interesado',
    "fechaCompra" DATETIME,
    "fechaEntregaSolicitada" DATETIME,
    "fechaEnvioReal" DATETIME,
    "montoPagado" REAL,
    "nota" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prenda_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");
