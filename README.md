# Abeto Calendar

Abeto Calendar permite que una persona organizadora publique un enlace de reserva y gestione reuniones uno a uno. Quien recibe el enlace puede ver horarios ocupados y reservar una franja disponible sin crear una cuenta.

## Desarrollo local

Consulta [docs/development.md](docs/development.md) para configurar variables, iniciar PostgreSQL con Docker Compose y ejecutar la aplicación.

## Reglas del calendario

- Todas las disponibilidades se interpretan en `America/Santiago`.
- Los días de la semana se habilitan por separado y comparten el mismo conjunto de franjas semanales. Las excepciones fechadas agregan o bloquean franjas parciales; se aplican todos los bloqueos después de las aperturas.
- Las reservas usan intervalos semiabiertos `[inicio, fin)`, duran un número fijo de minutos y no cruzan de día.
- Las horas locales inexistentes o ambiguas por horario de verano no se ofrecen ni se aceptan.
- Las pruebas con base de datos usan `abeto_calendar_test`; los datos de desarrollo están en `abeto_calendar`.
