# Sheet

Accessible right- or left-side dialog panel built on the project's existing Base UI Dialog primitive. It supplies a portal, backdrop, motion-aware transition styles, title/description exports, and semantic header/body/footer helpers.

## Props

- `Sheet`: Base UI root props, including `open` and `onOpenChange` for controlled state.
- `SheetContent`: Base UI popup props and optional `side` (`left` or `right`, default `right`).
- `SheetClose`: Base UI close props, styled with the installed Button's ghost icon variant.
- `SheetHeader`, `SheetBody`, `SheetFooter`: standard div props plus children.
- `SheetTitle`, `SheetDescription`, `SheetTrigger`: Base UI Dialog parts.

## Usage

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetBody>
      <SheetHeader>
        <SheetTitle>Detalles de la reserva</SheetTitle>
        <SheetDescription>Información de la cita.</SheetDescription>
      </SheetHeader>
      {/* panel content */}
    </SheetBody>
  </SheetContent>
</Sheet>
```

## Accessibility and states

The Base UI root manages modal focus, inert background content, and Escape handling. A programmatically opened sheet should restore focus to its invoking control when it closes. Every sheet must contain a visible or screen-reader-accessible `SheetTitle` and should include a `SheetDescription`. Reduced-motion preferences disable the panel transition.
