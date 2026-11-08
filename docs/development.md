# Entorno local

## Requisitos

- Node.js 24
- pnpm
- Docker con Docker Compose

## Variables

```powershell
Copy-Item .env.example .env
```

`.env.example` contiene solo credenciales locales de desarrollo. Cambia `BETTER_AUTH_SECRET` por un valor aleatorio de al menos 32 caracteres antes de iniciar la aplicación.

Si cambias `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` o `POSTGRES_PORT`, actualiza también `DATABASE_URL` y `TEST_DATABASE_URL` para que coincidan. Codifica los caracteres reservados de la contraseña con URL encoding dentro de ambas URL.

## PostgreSQL

```powershell
docker compose up -d --wait
docker compose logs -f db
```

Compose publica PostgreSQL en `localhost:${POSTGRES_PORT:-5432}` y mantiene los datos en el volumen nombrado `postgres_data`. Al iniciar un volumen vacío, PostgreSQL crea la base `abeto_calendar_test`, reservada para pruebas.

```powershell
docker compose down
```

`down` detiene y elimina el contenedor y la red, pero conserva `postgres_data`. No uses `docker compose down --volumes` para el trabajo diario: elimina ambas bases y todos sus datos locales.

Si necesitas ver los registros sin seguirlos en vivo:

```powershell
docker compose logs db
```

## Prisma

El cliente generado se actualiza al instalar dependencias y antes de `dev` o `build`. Una vez que la migración inicial esté creada:

```powershell
pnpm prisma migrate dev
pnpm prisma generate
```

La aplicación usa `DATABASE_URL`. Las pruebas con acceso a datos deben usar exclusivamente `TEST_DATABASE_URL`; nunca configures una prueba para apuntar a `DATABASE_URL`.

```powershell
pnpm test
pnpm test:db
```

`test:db` comprueba que `TEST_DATABASE_URL` apunta a PostgreSQL local y a la base `abeto_calendar_test`, aplica migraciones pendientes allí y ejecuta pruebas de integración con datos de prueba aleatorios que se limpian al terminar cada caso. `pnpm db:migrate:test` aplica solo las migraciones a esa base.

## Aplicación

```powershell
pnpm dev
```

Abre <http://localhost:3000>. Para revisar lint y tipos:

```powershell
pnpm lint
pnpm typecheck
```
