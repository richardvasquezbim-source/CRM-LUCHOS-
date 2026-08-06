-- Fase 1 del pedido a Ericka: registro de telas + tabla de consumo por talla.
-- Cambio aditivo: solo crea tablas nuevas. No toca ninguna tabla existente
-- (ni las del CRM ni las del catálogo que comparten esta base de datos).

-- CreateTable
CREATE TABLE "Tela" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "costoPorMetro" DOUBLE PRECISION,
    "metrajeDisponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL DEFAULT 'metros',
    "unidadOriginal" TEXT,
    "costoTotal" DOUBLE PRECISION,
    "fechaCompra" TIMESTAMP(3),
    "fechaEnvio" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoTalla" (
    "talla" INTEGER NOT NULL,
    "metros" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConsumoTalla_pkey" PRIMARY KEY ("talla")
);

-- Semilla de consumo por talla (algodón/felpa, ~S/16/m). Editable luego.
INSERT INTO "ConsumoTalla" ("talla", "metros") VALUES
  (0, 0.067),
  (1, 0.081),
  (2, 0.169),
  (3, 0.250),
  (4, 0.331),
  (5, 0.419),
  (6, 0.500),
  (7, 0.581),
  (8, 0.669),
  (9, 0.750),
  (10, 0.831);
