-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteNombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'interesado',
    "fechaSolicitada" DATETIME,
    "fechaEnvioReal" DATETIME,
    "montoPagado" REAL,
    "nota" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
