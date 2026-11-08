# Event configuration form

Edits event title, description, duration, inclusive date range, enabled weekdays, and up to eight shared weekly time windows. The form calls `updateEventConfigAction` and keeps its draft values visible when the server returns a validation error.

## Props

- `event`: event details needed to initialize the editable fields, including the Chile time zone.
- `weekdays`: enabled-day flags indexed Sunday `0` through Saturday `6`.
- `weeklyWindows`: every persisted interval as minute offsets, sorted by start time by the server page.
- `onOptimisticChange`: updates the event summary while the save is pending; an action failure returns the summary to the saved props while keeping the editable draft intact.

## Usage

```tsx
<EventConfigForm event={event} weekdays={weekdays} weeklyWindows={weeklyWindows} />
```

## States and interactions

- Date inputs show the configured inclusive range; the timezone is visible.
- Checkboxes enable or disable days, and time rows can be added or removed.
- Existing intervals render as editable rows; none are hidden.
- The action state shows pending, success, or error feedback with an accessible live region.
