# Carga de la reserva pública

## Propósito

Estado de carga del segmento `/reservar/[token]`. Reutiliza `PublicBookingSkeleton` para reflejar el calendario, la línea de tiempo y el formulario pendientes.

## Props

No recibe props.

## Uso

Next.js lo muestra automáticamente mientras resuelve `page.tsx`:

```tsx
export default function PublicBookingLoading() {
  return <PublicBookingSkeleton />;
}
```

## Accesibilidad

El estado de carga conserva el fondo muted de tono cálido y cambia a dos columnas desde 768 px, con la altura ajustada al viewport. Bajo ese ancho conserva el flujo apilado.

El skeleton contiene un estado de carga accesible y conserva tokens de fondo, borde y texto del tema.
