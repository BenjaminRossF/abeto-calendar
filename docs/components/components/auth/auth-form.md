# Organizer authentication form

Client form for organizer sign-in and registration. It invokes the Server Actions in `app/actions/auth.ts` and never contacts the database directly.

## Props

No props. The component owns the selected mode and keeps values controlled so action errors do not discard input.

## Usage

```tsx
<AuthForm />
```

## States and interactions

- Sign-in asks for email and password; registration also asks for the organizer name.
- The submit button reports pending work and prevents duplicate submissions.
- Server errors appear in an announced alert while field values remain available for correction.
- Controls have associated labels, native input types, autocomplete hints, and visible keyboard focus.
