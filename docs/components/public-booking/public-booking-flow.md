# PublicBookingFlow

## Propósito

Presenta la vista pública de reserva en dos columnas: calendario y agenda a la izquierda, formulario a la derecha. Se usa dentro de `/reservar/[token]`; no consulta datos por cuenta propia y solo recibe un DTO público para la fecha seleccionada.

## Props

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `view` | `PublicBookingView` | Título, descripción, duración, rango de fechas, fecha elegida, ventanas del día, slots de 15 minutos, bloques ocupados anónimos y disponibilidad para hora precisa. Incluye `America/Santiago` como zona visible. |
| `action` | `(formData: FormData) => Promise<ActionState>` | Server Action ya enlazada al token del evento. Recibe `date`, `startTime`, `firstName`, `lastName` y `mode`. |
| `initialSection` | `"calendar" | "timeline"` | Sección del acordeón que se abre al montar el flujo. La ruta elige `timeline` tras cambiar la fecha y `calendar` para una visita directa. |

La página debe obtener las lecturas en el servidor y pasar esta vista serializable. No se incluyen nombres de participantes existentes ni identificadores de reservas.

## Uso

```tsx
<PublicBookingFlow action={createPublicBookingAction.bind(null, token)} initialSection="calendar" view={publicView} />
```

El componente permite seleccionar días dentro del rango del evento, ingresar nombre y apellido antes de elegir la hora en el formulario derecho, y enviar la reserva con `useActionState`. La vista usa superficies blancas sobre neutros cálidos y el token `primary` verde del tema semántico; el calendario y la agenda comparten una sola tarjeta, separada internamente por el acordeón. Una línea divisora separa las columnas. El acordeón inicia con el calendario abierto y pasa a la agenda al cambiar la fecha.

## Estados e interacciones

- **Disponibilidad:** muestra el día completo con ventanas de atención sombreadas y bloques ocupados anónimos; desplaza la agenda al primer horario de atención o reserva.
- **Navegación:** el acordeón alterna entre calendario y agenda. Al elegir un día abre la agenda de esa fecha; el encabezado del calendario permanece disponible para volver y elegir otro día.
- **Vacío:** distingue los días sin horario de atención de los días sin reservas; la cuadrícula horaria sigue visible y permite volver a los controles para elegir otro día.
- **Horario predeterminado:** muestra un selector con los slots disponibles de 15 minutos, indicando inicio y término. Selecciona inicialmente el primero; los horarios ocupados no aparecen. Si no quedan slots, explica la situación y permite cambiar de día o activar la hora exacta cuando haya disponibilidad precisa.
- **Hora:** a la derecha del selector aparecen radios para un slot disponible o una hora exacta. Al elegir «Hora exacta», el selector se sustituye por un campo de hora de un minuto. Si se vuelve al modo disponible, conserva la hora cuando siga disponible o selecciona el primer slot. El servidor vuelve a validar la hora y su zona horaria.
- **Pendiente:** deshabilita cambios de fecha y formulario mientras se guarda, con estado accesible.
- **Error/conflicto:** conserva los campos de nombre y apellido. Si el horario se ocupó durante el envío, refresca los datos del servidor y permite elegir otro slot.
- **Confirmación:** muestra el nombre ingresado, fecha, inicio, término, duración y `America/Santiago`. No muestra el enlace del evento ni controles para editar la reserva.

Desde 768 px, la página limita su altura al viewport y muestra el calendario y el formulario en dos columnas. La agenda ocupa el espacio disponible del acordeón; el desplazamiento de las 24 horas queda dentro de su región y el formulario permanece visible. Bajo 768 px, las columnas se apilan y la página puede desplazarse para conservar controles legibles.

El calendario usa botones nativos de teclado dentro de una tabla, etiquetas de fecha completas y navegación mensual accesible.

La agenda es informativa y no permite seleccionar horas. El formulario queda sobre el fondo muted. La vista compone Accordion, Card, Field, Input, NativeSelect, RadioGroup y Separator del CLI de shadcn. La línea divisora entre columnas pasa a ser horizontal en pantallas estrechas. Todos los controles tienen etiquetas y funcionan con teclado.
