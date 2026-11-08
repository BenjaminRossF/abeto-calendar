# Monthly event calendar

Displays a month's confirmed reservations, supports day selection and month navigation, and renders a full-width hourly agenda below the month. Selecting an agenda block opens a right-side Sheet for that reservation. The server page loads the month and passes names/timestamps and schedule rules as serializable props; the calendar does not fetch data.

## Props

- `event`: event identity, inclusive date bounds, duration, and timezone.
- `weekdays`, `weeklyWindows`, `exceptions`: schedule rules used to show the selected day's actual attention windows, including date-specific openings and blocks.
- `bookings`: confirmed reservations for the visible month, including name and start/end timestamps.
- `month`: visible `YYYY-MM` string.
- `selectedDate`: initial selection within the month.
- `today`, `now`: Chile-local date and server timestamp for labels and determining whether a booking can be changed.

## Schedule source

`weekdays`, `weeklyWindows`, and `exceptions` are passed from the server page and resolved for the selected date with the shared availability rules. The component does not query the database.

## Usage

```tsx
<MonthlyEventCalendar event={event} weekdays={weekdays} weeklyWindows={weeklyWindows} exceptions={exceptions} bookings={bookings} month={month} selectedDate={selectedDate} today={today} now={now} />
```

## States and interactions

- Previous/next links move within the event's date range; day buttons select a date without another read. The calendar supports arrow-key day/week movement and Home/End within the visible month.
- Each day previews up to two booking times; desktop also shows the first name, mobile keeps the compact times, and additional bookings are summarized with `+N`.
- Reservation counts are visible in the calendar. The hourly agenda places named bookings by local start and end time; selecting one opens its Sheet.
- Empty days distinguish dates without configured attention hours from available days without confirmed reservations.
- The agenda spans 00:00 to 24:00, uses proportional event durations, separates simultaneous bookings into columns, and scrolls to the first reservation.
- The Sheet shows confirmed reservation details, allows an available future reservation to be reprogrammed, or asks for confirmation before cancellation.
- Opening the Sheet moves focus into the dialog; closing it returns focus to the clicked reservation, or the selected calendar day when an action removed that row.
- A cancellation removes the row optimistically; errors restore it. Reprogramming shows the requested date/time while pending and rolls back on failure.
- Past bookings show details without active reschedule/cancel controls. If a booking crosses midnight, the day agenda clips its block at 24:00.
