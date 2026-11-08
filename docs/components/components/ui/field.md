# Field

## Propósito

Compone etiquetas, controles, mensajes de ayuda y errores con espaciado y semántica accesibles.

## Props

Field acepta atributos de div y orientation (vertical, horizontal o responsive). FieldGroup organiza varios campos. FieldSet y FieldLegend agrupan controles relacionados. FieldLabel, FieldDescription, FieldError, FieldContent, FieldTitle y FieldSeparator completan el formulario.

## Uso

~~~tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="name">Nombre</FieldLabel>
    <Input id="name" name="firstName" required />
  </Field>
</FieldGroup>
~~~

El estado de error se indica con data-invalid en Field, aria-invalid en el control y FieldError junto al campo.
