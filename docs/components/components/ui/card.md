# Card

## Propósito

Agrupa contenido en una superficie del tema. En la reserva pública envuelve el acordeón que alterna entre calendario y agenda.

## Props

Card acepta atributos de div y la prop size (default o sm). CardHeader, CardTitle, CardDescription, CardAction, CardContent y CardFooter aceptan atributos de div.

## Uso

~~~tsx
<Card>
  <CardHeader>
    <CardTitle>Calendario</CardTitle>
    <CardDescription>Elige una fecha.</CardDescription>
  </CardHeader>
  <CardContent>{/* contenido */}</CardContent>
</Card>
~~~

Las superficies y los bordes usan los tokens card, card-foreground y border.
