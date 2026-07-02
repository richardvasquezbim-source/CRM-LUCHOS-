@AGENTS.md

# CRM Petshop

CRM interno (1-2 usuarios) para llevar el control de pedidos de un negocio de prendas
y accesorios para mascotas. Ver el spec completo en la conversación/plan original para
el detalle de producto; este archivo cubre stack y convenciones de código.

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind v4, shadcn/ui (sobre Base UI, no Radix).
- Prisma 7 + SQLite local (`prisma/dev.db`) via driver adapter `@prisma/adapter-better-sqlite3`.
- Validación con Zod.

## Convenciones

- **Server Actions, no API routes**: las mutaciones viven en `src/app/pedidos/actions.ts`
  con `'use server'`. No hay capa REST separada; es una herramienta interna.
- **`src/lib/estados.ts` es la unica fuente de verdad** de los 4 estados del pedido
  (`interesado`, `falta_pago`, `enviar_hoy`, `enviado`). El campo `estado` en Prisma es
  un `String` simple (no un `enum` de Prisma) a propósito: así renombrar/reordenar
  estados es editar un archivo de código, sin migración de base de datos, y el campo
  se comporta igual en SQLite y Postgres.
- **Validación Zod compartida**: `src/lib/validations/pedido.ts` define `pedidoSchema`,
  usado tanto por los formularios (via `useActionState`) como por las server actions.
- **Formularios nativos, no react-hook-form**: el shadcn de esta versión reemplazó el
  viejo componente `form` (basado en react-hook-form) por primitivas `Field`/`FieldLabel`/
  `FieldError` (`src/components/ui/field.tsx`). Los formularios usan `<form action={...}>`
  con Server Actions y `useActionState` para mostrar errores de validación y estado
  pendiente (ver `src/components/pedido-form.tsx`).
- **Prisma Client generado en `src/generated/prisma`** (no en `node_modules`), config en
  `generator client` de `prisma/schema.prisma`. Este directorio esta en `.gitignore`;
  se regenera con `npx prisma generate` (o automáticamente al correr `migrate dev`).
- **Prisma 7 requiere un driver adapter explícito** (ya no hay motor Rust implícito).
  El adapter se instancia en `src/lib/prisma.ts` (singleton) y en `prisma/seed.ts`.
- **`prisma.config.ts`** (no el bloque `datasource` de `schema.prisma`) es quien lee
  `DATABASE_URL` desde `.env`. El `datasource` en `schema.prisma` solo declara el
  `provider`.

## Comandos

```bash
npm run dev              # servidor de desarrollo
npx prisma migrate dev   # aplicar cambios de schema (crea migración)
npx prisma generate      # regenerar el Prisma Client
npx prisma db seed       # cargar datos de ejemplo (prisma/seed.ts)
npx prisma studio        # explorar la base de datos con UI
```

## Nota de entorno (Windows, esta máquina)

Node.js se instaló durante el setup inicial; las sesiones de shell nuevas no siempre
heredan el PATH actualizado de inmediato. Si `node`/`npm` no se reconocen, hay que
refrescar `$env:Path` desde el registro de Windows en esa sesión. Por eso el preview
del proyecto usa `dev.cmd` (raíz, no versionado) como `runtimeExecutable` en
`.claude/launch.json`: ese script fija el PATH antes de correr `npm run dev`.

## Camino local -> nube

Cuando se decida desplegar a Supabase/Postgres:

1. Cambiar `provider = "postgresql"` en el `datasource` de `prisma/schema.prisma`.
2. Apuntar `DATABASE_URL` (en `.env` / variables de entorno del hosting) a la cadena de
   conexión de Supabase.
3. Cambiar el driver adapter en `src/lib/prisma.ts` (y `prisma/seed.ts`) de
   `@prisma/adapter-better-sqlite3` a `@prisma/adapter-pg` (u otro adapter de Postgres).
4. Generar migraciones nuevas para Postgres (`npx prisma migrate dev`) y desplegar
   (por ejemplo, Vercel conectado al repo de GitHub).

Ningún otro código de la aplicación (server actions, componentes, validaciones) debería
cambiar en este salto.

## Fuera de alcance (MVP)

Métricas/gráficos, inventario/stock, múltiples usuarios con permisos, importación
masiva, integración automática con WhatsApp/correo. Los campos de monto y fechas ya se
capturan desde ahora aunque la visualización de métricas se posponga.
