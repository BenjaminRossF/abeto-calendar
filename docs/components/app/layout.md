# Root layout

Sets Spanish as the document language, loads the project fonts, defines global metadata, and applies the existing semantic theme to all routes.

## Props

Next.js supplies the route `children`; the layout has no application-specific props.

## Usage

```tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="es"><body>{children}</body></html>;
}
```

## States

Route loading and error states are handled by the matching `loading.tsx` and `error.tsx` files.
