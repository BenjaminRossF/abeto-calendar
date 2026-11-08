# Verificaciones

## Entorno local

Comprobado durante la implementación:

- `docker compose config --quiet`: configuración válida.
- `docker compose up -d --wait db`: PostgreSQL 17 inicia y queda saludable.
- `docker compose ps`: puerto publicado únicamente en `127.0.0.1:5432`.
- La base exclusiva `abeto_calendar_test` se crea al inicializar el volumen vacío.
- Persistencia: se creó una tabla temporal de verificación en la base de pruebas,
  se insertó una fila, se ejecutó `docker compose down` y se volvió a levantar el
  servicio. La fila seguía disponible. La tabla de verificación se retiró después.

La comprobación de persistencia no utiliza la base de desarrollo ni elimina
volúmenes. No se debe ejecutar `down --volumes` como parte de estas verificaciones.

## Referencia inicial

Antes de los cambios funcionales pasaban `pnpm lint` y
`pnpm exec tsc --noEmit`. Esto establece la referencia para distinguir fallos
preexistentes de los introducidos por la implementación.

## Verificaciones funcionales

La prueba de reglas `node --test tests/availability.test.mjs` pasó sus 10 casos:
franjas, excepciones, ocupación, precisión y cambios de horario de Chile. Node
mostró un aviso de detección de módulos; no afectó el resultado.

`node scripts/test-db.mjs` aplicó las migraciones pendientes exclusivamente en
`abeto_calendar_test` y pasó sus 7 pruebas de integración, incluidas carreras
de reserva y configuración, autorización y conservación de reservas. El driver
`pg` emitió un aviso de deprecación durante las pruebas concurrentes.

En navegador, con una cuenta y datos sintéticos en la base de pruebas, se
comprobaron registro, cierre de sesión, error recuperable e inicio de sesión,
vista vacía y creación de evento. Se reservó un horario estándar y otro preciso
de 14:50; la confirmación permaneció visible y la ocupación pública no mostró
nombres. Se reprogramó y canceló una reserva desde el panel organizador. Un
cambio de duración incompatible mostró el error, conservó el valor introducido
y revirtió el resumen optimista. Se revisaron capturas de escritorio y móvil,
incluido el tema oscuro del organizador. El usuario y sus datos de prueba se
eliminaron después de la comprobación.

`eslint .`, `tsc --noEmit` y `git diff --check` finalizaron sin errores; Git
avisó de la conversión de finales de línea. `next build` pasó con acceso a red
para descargar las fuentes; en el entorno sin ese acceso falló la descarga de
Google Fonts. En desarrollo, las vistas probadas no registraron errores en
`/_next/mcp`; la descarga de fuentes tuvo avisos y se usó una fuente alternativa.
`trail build` y `trail check` finalizaron correctamente.
