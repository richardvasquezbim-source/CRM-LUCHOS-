-- Fase 2 del pedido a Ericka: campos de producción en Prenda.
-- Cambio aditivo: solo agrega columnas nuevas (todas nullable) y una FK a Tela.
-- No modifica ni borra datos existentes.

-- AddColumn
ALTER TABLE "Prenda" ADD COLUMN "telaId" TEXT;
ALTER TABLE "Prenda" ADD COLUMN "tipoPedido" TEXT;
ALTER TABLE "Prenda" ADD COLUMN "catalogoGrupo" TEXT;
ALTER TABLE "Prenda" ADD COLUMN "tallaNumero" INTEGER;

-- AddForeignKey: al borrar una tela, sus pedidos quedan con telaId nulo
-- (no se borran). La UI además impide borrar una tela con pedidos vinculados.
ALTER TABLE "Prenda" ADD CONSTRAINT "Prenda_telaId_fkey"
  FOREIGN KEY ("telaId") REFERENCES "Tela"("id") ON DELETE SET NULL ON UPDATE CASCADE;
