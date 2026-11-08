# Event management page

Coordinates the organizer's event header, public share link, active state, archive confirmation, month calendar, weekly availability editor, and dated exceptions. Data is passed from the server page as serializable props; the client component only handles interaction and calls Server Actions.

## Props

Receives `EventDetailsProps`: the narrow event summary, enabled weekdays, weekly windows, dated exceptions, one calendar month's confirmed bookings, selected month/date, and Chile's current date.

## Usage

```tsx
<EventManagement {...eventDetails} />
```

## States and interactions

- The event can be published or paused with an optimistic status label that rolls back on action failure.
- Saving configuration previews the pending title, date range, duration, weekdays, and window count; failures restore the saved summary and keep the form draft for correction.
- The public link can be copied, or opened in a new tab.
- The archive action asks for confirmation before soft-deleting the event.
- Calendar selection and the reservation sheet are handled by `MonthlyEventCalendar`.
- Weekly hours and date exceptions are edited in dedicated forms that retain input on recoverable errors.
