# RadioGroup

## Propósito

Permite elegir una opción con los controles de radio Base UI de shadcn.

## Props

RadioGroup acepta props de Base UI como value, onValueChange y disabled. RadioGroupItem acepta las props del control, incluido value, id y disabled.

## Uso

~~~tsx
<RadioGroup value={mode} onValueChange={setMode}>
  <Field orientation="horizontal">
    <RadioGroupItem id="available" value="available" />
    <FieldLabel htmlFor="available">Horario disponible</FieldLabel>
  </Field>
</RadioGroup>
~~~

En la reserva, el grupo alterna entre el selector de horarios y la entrada de hora exacta.
