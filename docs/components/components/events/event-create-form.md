# Event creation form

Creates an event with a date range, weekly day availability, shared weekly time windows, and appointment duration. The form calls `createEventAction`; it does not read from or write to the database directly.

## Props

- `today`: current calendar date in `America/Santiago`, used as the minimum start date.

## Usage

```tsx
<EventCreateForm today="2026-11-06" />
```

## States and interactions

- Monday through Friday and the two default time windows (08:00–10:00, 12:00–14:00) are preselected.
- The organizer can change the inclusive date range, duration, enabled weekdays, and add or remove up to eight time windows.
- Action errors are announced without clearing the entered values.
- Pending submission disables the submit button and announces its progress label.
