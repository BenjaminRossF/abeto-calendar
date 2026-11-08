# Event archive confirmation

Provides a focus-managed Base UI Alert Dialog for the event soft-delete action. It explains the effect on the public link and existing reservations before invoking `deleteEventAction`.

## Props

- `eventId`: event identifier bound to the server action.

## Usage

```tsx
<EventArchiveDialog eventId={event.id} />
```

## States and interactions

- The destructive action only runs after the user confirms inside the dialog.
- While pending, both actions are disabled and the submit button reports progress.
- Recoverable server errors stay visible in the dialog.
- Base UI handles keyboard focus, Escape, and focus restoration.
