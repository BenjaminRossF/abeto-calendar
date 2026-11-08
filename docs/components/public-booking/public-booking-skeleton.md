# PublicBookingSkeleton

## Propósito

Representa la estructura de dos columnas de la vista pública mientras el servidor consulta el evento y los horarios. Muestra el calendario abierto y el encabezado de la agenda plegado dentro de una misma tarjeta; mantiene el formulario fuera de ella.

## Props

No recibe props.

## Uso

```tsx
<Suspense fallback={<PublicBookingSkeleton />}>
  <PublicBookingContent pageDataPromise={pageDataPromise} />
</Suspense>
```

También se reutiliza desde `app/reservar/[token]/loading.tsx` para la carga del segmento.

## Estados

El esqueleto refleja el encabezado y la cuadrícula mensual abiertos, el encabezado plegado de la línea de tiempo y, a la derecha, los campos de datos y controles de hora. Desde 768 px limita la altura al viewport y muestra dos columnas; bajo ese ancho deja que la página se desplace. Incluye un estado de carga accesible para lectores de pantalla.
