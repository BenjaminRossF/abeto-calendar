# Dated event exceptions

Lists and creates one-off availability changes for an event. People see friendly labels for adding a specific opening or blocking a time range; `OPEN` and `BLOCK` are submitted as backend values but are not exposed as internal terms.

## Props

- `eventId`: event identifier for the Server Actions.
- `startDate`, `endDate`: inclusive event bounds used by the date field.
- `today`: current date in the event's Chile timezone, used as the initial date.
- `exceptions`: serialized date, kind, and minute range values.

## Usage

```tsx
<EventExceptions eventId={event.id} startDate={event.startDate} endDate={event.endDate} today={today} exceptions={exceptions} />
```

## States and interactions

- The form adds a single partial opening or blocked time range for a selected date.
- Existing exceptions are labeled “Disponibilidad extra” or “Bloqueo” with Chilean local time.
- New entries appear optimistically; failures roll back and preserve the form values.
- Removing an exception hides it optimistically and restores it if the action fails.
- Empty and action-error states explain what happened.
