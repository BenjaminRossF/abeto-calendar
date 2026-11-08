# Organizer event list

The dashboard page reads the current session and the organizer's non-deleted events on the server. It serializes only the fields needed for the event cards and orders current events before upcoming and past ones.

## Props

The route takes no application-specific props. Each event card uses a narrow server-side projection: id, title, description, duration, date range, active state, public path, and confirmed booking count.

## Usage

Visit `/dashboard` after signing in. Use **Crear evento** to configure availability or **Gestionar** to open an event calendar.

## States and interactions

- The page-level `Suspense` fallback mirrors the heading and card grid while the session and events load.
- An empty account receives a useful first-event action.
- Current, future, and past events are listed with an active/paused/finished label.
- Dynamic event links opt into prefetching for the event detail route.
