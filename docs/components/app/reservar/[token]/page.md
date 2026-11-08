# Página pública de reserva

## Propósito

Carga la información pública del evento identificado por token, obtiene solo los intervalos ocupados necesarios para la fecha elegida y entrega un DTO serializable a `PublicBookingFlow`. La lectura se inicia desde la página y se resuelve bajo `Suspense` para Cache Components. No requiere cuenta ni correo de la persona que reserva.

## Props de ruta

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `params` | `Promise<{ token: string }>` | Token público del evento. |
| `searchParams` | `Promise<{ date?: string \| string[]; section?: string \| string[] }>` | Fecha mensual seleccionada y sección del acordeón. `date` se valida contra el rango del evento; `section=timeline` abre la agenda después de elegir un día. |

## Uso

La ruta se abre como `/reservar/<token>` y admite `/reservar/<token>?date=YYYY-MM-DD` para elegir el día. Al seleccionar una fecha, el flujo agrega `section=timeline` para abrir la agenda. La acción pública de `app/dashboard/actions.ts` guarda la reserva tras validar nombre, apellido, fecha, modo y disponibilidad en el servidor.

## Estados

La vista usa neutros cálidos y verdes esmeralda en los tokens semánticos del tema shadcn. Desde 768 px distribuye el calendario y la agenda a la izquierda, y los datos y la hora a la derecha con un divisor. La altura se ajusta al viewport para que el formulario esté visible sin desplazar la página; bajo ese ancho las columnas se apilan.

- **Carga:** `Suspense` y `loading.tsx` muestran `PublicBookingSkeleton`.
- **Disponible:** se muestran detalles del evento, rango de fechas, duración y zona `America/Santiago`.
- **Sin horarios:** el flujo explica que la fecha no tiene horas disponibles y permite probar otra.
- **Evento inexistente, pausado o eliminado:** respuesta genérica de enlace no disponible; no revela información del organizador.
- **Fallo de lectura:** `error.tsx` ofrece reintento con `retry()` y no expone mensajes internos.

Las consultas seleccionan campos mínimos del evento y los campos `startAt`/`endAt` de reservas confirmadas. Los nombres de participantes no se consultan ni se envían al cliente.
