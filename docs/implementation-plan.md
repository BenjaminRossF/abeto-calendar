# Abeto Calendar

## Objetivo

Los organizadores crean eventos para ofrecer reuniones individuales durante un
rango de fechas. Cada evento tiene un enlace público común para todos sus
participantes. El participante reserva con nombre y apellido, sin cuenta ni
correo; solo el organizador puede reprogramar o cancelar reservas.

## Decisiones de producto

- Interfaz en español y horarios siempre en `America/Santiago`.
- Las fechas de inicio y cierre son inclusivas en Chile. Un evento futuro también
  aparece entre los actuales; pasa a anteriores al terminar su fecha de cierre.
- Cada evento tiene una duración fija, días semanales habilitados y varias franjas
  generales compartidas por esos días. Por ejemplo, 08:00–10:00 y 12:00–14:00.
- Las excepciones de una fecha permiten agregar disponibilidad o bloquearla, con
  resolución de un minuto. Los bloqueos siempre prevalecen.
- El selector propone inicios cada 15 minutos y permite introducir una hora
  precisa. La reunión completa debe caber en una franja disponible y ser futura.
- Se permiten reuniones consecutivas, pero no solapamientos dentro del mismo
  evento. Los eventos distintos son independientes.
- Las franjas no cruzan medianoche. Las horas locales inexistentes o ambiguas por
  cambios de horario se rechazan. Los instantes se almacenan en UTC.
- La ocupación pública es anónima. Los nombres repetidos están permitidos y no se
  utilizan para autorizar modificaciones.
- El organizador no puede cambiar la configuración de forma que invalide reservas
  futuras activas. Primero debe reprogramarlas o cancelarlas.
- Eliminar un evento es una eliminación lógica con confirmación: deshabilita su
  enlace y conserva el historial.
- Esta versión no incluye notificaciones por correo, integraciones de calendario
  externas ni edición pública de reservas.

## Etapas y responsabilidades

Implementación por `gpt-6-luna` con esfuerzo `max`; revisión rápida por
`gpt-6.1-terra` con esfuerzo `low`. Después de cada entrega se revisan permisos,
integridad, interfaz, pruebas y documentación; los hallazgos se corrigen antes de
dar la etapa por terminada.

1. **Entorno local:** Compose con PostgreSQL 17, puerto local configurable,
   healthcheck y volumen persistente; ejemplo de configuración sin secretos y
   documentación de inicio, parada y conservación de datos.
2. **Persistencia y acceso:** Prisma, migraciones versionadas y Better Auth para
   registro, ingreso y cierre de sesión de organizadores con correo y contraseña.
3. **Disponibilidad:** funciones puras de calendario, zona horaria, excepciones y
   validación; serialización transaccional de operaciones por evento.
4. **Organizador:** lista de eventos, formulario, enlace compartido, calendario
   mensual, panel de detalles, edición, reprogramación y cancelación.
5. **Participante:** calendario de selección, línea temporal de ocupación, selección
   de horario y confirmación después de guardar la reserva.
6. **Verificación:** pruebas de reglas, permisos y concurrencia; comprobaciones de
   tipos, lint, build y recorrido completo en navegador; revisión final de Terra.

## Contratos técnicos

- PostgreSQL es la base de datos y Prisma el único ORM.
- La aplicación Next.js se ejecuta en el host; Compose levanta el servicio `db`.
  Los datos sobreviven a `docker compose down` mediante un volumen nombrado.
- Las pruebas que escriben usan exclusivamente `abeto_calendar_test`.
- Las lecturas se inician desde `page.tsx`, pudiendo delegarse en funciones de
  servidor. Los hijos reciben únicamente datos serializables necesarios.
- Las mutaciones de negocio son Server Actions: validan entradas y verifican
  permisos en el servidor antes de escribir.
- Toda operación que cambie disponibilidad u ocupación bloquea la fila del evento
  dentro de la misma transacción, antes de comprobar y escribir sus cambios.
- Los estados optimistas son reversibles. Una reserva no se anuncia como
  confirmada hasta que el servidor haya guardado el resultado.
- Se conservan Cache Components y Partial Prefetching. Los datos dinámicos se
  presentan con límites de Suspense y skeletons adecuados a la vista.
- La interfaz usa el tema semántico y los componentes shadcn/Base UI existentes.
  Cada componente nuevo o modificado tiene documentación propia.
- No se agrega ningún paquete sin autorización explícita del usuario.

## Criterios de aceptación

- Un organizador completa registro, creación de evento y copia de su enlace.
- Dos visitantes usan ese mismo enlace y ven ocupación sin nombres ajenos.
- Dos solicitudes simultáneas para intervalos incompatibles producen exactamente
  una reserva; el otro participante recibe un error recuperable.
- El propietario ve las reservas en un calendario mensual y puede reprogramarlas
  o cancelarlas. Otro organizador no puede consultarlas ni modificarlas.
- Los bloqueos, habilitaciones, pausas y límites se respetan tanto en la interfaz
  como al enviar directamente una mutación al servidor.
- Se prueban cambios de horario de Chile, reuniones consecutivas y precisión de
  minutos, además de carga, vacío, éxito y error.
- PostgreSQL inicia sano y conserva un dato de prueba después de detener y volver
  a iniciar el contenedor sin borrar volúmenes.
- Las verificaciones ejecutadas y sus limitaciones quedan documentadas; no se
  presenta como aprobada una prueba que no se pudo ejecutar.
