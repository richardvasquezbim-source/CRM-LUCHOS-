-- Marca de pedido urgente.
-- Cambio aditivo: agrega una columna nueva con valor por defecto `false`.
-- No modifica ni elimina ningún dato existente; las prendas ya registradas
-- quedan automáticamente como "no urgente".
ALTER TABLE "Prenda" ADD COLUMN "urgente" BOOLEAN NOT NULL DEFAULT false;
