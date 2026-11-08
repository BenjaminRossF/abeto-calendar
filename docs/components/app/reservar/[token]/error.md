# Error de la reserva pública

## Propósito

Límite de error del segmento público para fallos inesperados al renderizar o consultar disponibilidad. Presenta una explicación general y permite volver a intentar la lectura.

## Props

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `error` | `Error & { digest?: string }` | Error administrado por Next.js; no se muestra al visitante. |
| `retry` | `() => void` | Solicita a Next.js volver a consultar y renderizar el segmento. |

## Uso

Next.js lo monta automáticamente cuando falla un componente del segmento. El botón “Volver a intentar” llama `retry()`.

## Estados

Muestra un mensaje seguro y una acción de recuperación. No expone mensajes internos, credenciales ni datos del evento.
