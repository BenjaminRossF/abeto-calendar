# Reglas y arquitectura

## Límites de confianza

- El organizador se autentica con correo y contraseña. Sus páginas y Server Actions vuelven a comprobar la sesión y la propiedad del evento en el servidor.
- El enlace público contiene un token aleatorio de alta entropía. Permite consultar y crear una reserva; no permite reprogramar ni cancelar reservas existentes.
- Las lecturas de Prisma nacen en `page.tsx` y entregan a sus hijos solamente los campos que necesitan.
- Cada escritura que afecta a la ocupación o a la configuración bloquea primero la fila del evento dentro de la transacción, vuelve a validar la disponibilidad y después escribe.

## Tiempo y disponibilidad

- La zona horaria funcional es `America/Santiago`; las marcas de tiempo persistidas son instantes UTC.
- Los siete días tienen un indicador de habilitado y comparten el mismo conjunto de franjas semanales, almacenadas como minutos desde medianoche. Las excepciones fechadas agregan franjas parciales o las bloquean; nunca reemplazan toda la disponibilidad de la fecha. Los bloqueos se restan después de agregar las aperturas, por lo que prevalecen en cualquier solapamiento.
- El rango de una franja es semiabierto. Un turno `[10:00, 10:30)` no ocupa el turno contiguo que comienza a las 10:30.
- Los comienzos de turno se ofrecen cada 15 minutos. El modo de hora precisa usa incrementos de un minuto.
- Se rechazan franjas nocturnas, duraciones no enteras o menores que un minuto, fechas pasadas, horas inexistentes o ambiguas y reservas que no caben completas en una franja habilitada.
- Antes de cambiar duración o disponibilidad, el servidor comprueba que ninguna reserva futura activa quede fuera de las nuevas reglas.

## Concurrencia

Las reservas de dos eventos son independientes. Para crear, reprogramar o cancelar una reserva, y para editar disponibilidad, cambiar duración o desactivar el evento, la transacción adquiere un bloqueo de fila en su evento. La operación vuelve a leer la ocupación bajo ese bloqueo antes de confirmar los cambios.

La migración inicial agrega `CHECK` SQL para duración, fechas, zona fija, día semanal, límites de ventanas y orden de intervalos. Prisma Schema Language no modela estos checks; las migraciones futuras deben conservarlos. Las reglas entre varias filas, como el solapamiento de franjas y reservas, se validan en servidor mientras el bloqueo del evento está tomado.

## Estados de interfaz

Las rutas con datos distinguen carga, error y colección vacía. Las mutaciones muestran espera y errores de validación; el cliente no presenta una reserva como confirmada hasta que la transacción termine correctamente.
