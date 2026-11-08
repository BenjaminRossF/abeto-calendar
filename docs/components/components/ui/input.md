# Input

## Propósito

Campo de entrada shadcn basado en Base UI, con estilos de foco, error y estado deshabilitado del tema.

## Props

Acepta las props de un input HTML, incluido type, name, value, onChange, required y disabled.

## Uso

~~~tsx
<Field>
  <FieldLabel htmlFor="name">Nombre</FieldLabel>
  <Input id="name" name="name" required />
</Field>
~~~

El tamaño compacto es el predeterminado; la vista pública puede ajustar la altura con clases de layout.
