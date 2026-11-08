# NativeSelect

## Propósito

Selector nativo con estilos shadcn. En la reserva pública enumera los horarios disponibles y su duración.

## Props

Acepta las props de select, excepto el atributo HTML size. La prop de estilo size admite sm, default y lg; lg alinea su altura con los campos grandes. NativeSelectOption acepta las props de option; también se exportan NativeSelectOptGroup.

## Uso

~~~tsx
<Field>
  <FieldLabel htmlFor="time">Hora disponible</FieldLabel>
  <NativeSelect id="time" name="startTime" size="lg">
    <NativeSelectOption value="09:00">09:00–10:00</NativeSelectOption>
  </NativeSelect>
</Field>
~~~

Las opciones ocupadas se omiten. El control admite teclado y expone su valor al formulario nativo.
