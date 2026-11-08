# Accordion

## Propósito

Muestra una sección de contenido a la vez. En la reserva pública agrupa el calendario y la agenda del día.

## Props

`Accordion` acepta el valor controlado como una lista de secciones, `onValueChange` y `multiple`. `AccordionItem` requiere `value`; `AccordionTrigger` expande o contrae su sección; `AccordionContent` contiene el panel y acepta `fillAvailableHeight` para ocupar el espacio restante en layouts flex desde `md` (768 px), manteniendo el alto natural en pantallas estrechas.

## Uso

```tsx
<Accordion value={openSections} onValueChange={setOpenSections}>
  <AccordionItem value="calendar">
    <AccordionTrigger>Elige una fecha</AccordionTrigger>
    <AccordionContent>{calendar}</AccordionContent>
  </AccordionItem>
</Accordion>
```

Para un panel de altura disponible, el `AccordionItem` debe tener una altura limitada y usar `md:flex md:flex-1 md:flex-col`. El contenido puede usar un hijo `flex h-full min-h-0 flex-col` y un descendiente `min-h-0 flex-1 overflow-y-auto` para contener el desplazamiento dentro del panel.

En el flujo público, la sección inicial es `calendar`. Elegir una fecha cambia a `timeline`; ambos encabezados siguen disponibles para navegar entre secciones. Los controles de encabezado funcionan con teclado.
