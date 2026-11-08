# DayAgenda

## Propósito

Muestra una fecha como una agenda vertical sin tarjeta exterior, con 24 horas, ventanas de atención opcionales y bloques posicionados por minuto. En el flujo público puede ocupar el espacio restante junto al calendario y mantener su propio desplazamiento. En modo administrador, cada reserva es un botón que abre sus detalles; en modo público, los bloques son anónimos e informativos.

## Props

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `date` | `string` | Fecha local `YYYY-MM-DD` que se muestra como encabezado. |
| `timeZone` | `string` | Zona horaria que aparece junto a la fecha. |
| `blocks` | `AgendaBlock[]` | Bloques con `id`, `title`, `startMinute`, `endMinute`, `startTime` y `endTime`. |
| `windows` | `{ startMinute; endMinute }[]` | Ventanas de atención que se sombrean en la agenda. Si se omiten, no se muestra la leyenda de atención. |
| `fillAvailableHeight` | `boolean` | Opcional, por defecto `false`. Desde `md` ajusta la agenda al espacio disponible y permite desplazar su contenido; bajo ese breakpoint conserva un máximo de 35 rem. Se usa en la vista pública de reserva. |
| `onSelectBlock` | `(block, trigger) => void` | Opcional. Convierte los bloques en botones accesibles y entrega el elemento pulsado para restaurar el foco al cerrar un diálogo. |
| `emptyMessage` | `string` | Mensaje para diferenciar una fecha cerrada de una fecha sin reservas. |
| `privacyNote` | `string` | Nota contextual, usada en la vista pública para explicar que las reservas no incluyen datos personales. |

## Uso

```tsx
<DayAgenda
  blocks={blocks}
  date="2026-11-05"
  emptyMessage="No hay reservas confirmadas para este día."
  timeZone="America/Santiago"
  windows={[{ startMinute: 510, endMinute: 660 }]}
/>
```

## Estados e interacciones

- La cuadrícula cubre 00:00–24:00, usa 64 px por hora y se desplaza al horario relevante al cambiar de fecha.
- Las ventanas disponibles se sombrean con tokens del tema; las horas fuera de atención conservan el fondo atenuado.
- Los bloques se recortan a los límites del día y se distribuyen en columnas cuando coinciden.
- El contenedor admite desplazamiento con ratón, tacto y teclado. Los botones conservan foco visible y un nombre accesible con título e intervalo completos.
- Si no hay bloques, conserva la cuadrícula y muestra el mensaje recibido.
