# Event detail and calendar page

The server page validates the route event against the signed-in organizer, loads configuration and one calendar month's confirmed reservations from Prisma, and serializes only the fields needed by the event UI. The route starts that data promise and consumes it under `Suspense`.

## Props

Next.js supplies `params.eventId` and optional `searchParams.month` / `searchParams.date`. The page also reads the organizer session on the server.

## Usage

Open `/dashboard/events/<eventId>`. Use `?month=YYYY-MM` to view a month within the event's inclusive date range. Selecting a day in that month is local and does not trigger another read.

## Loading and error states

The fallback mirrors the event heading, monthly calendar, reservation panel, and configuration section. Missing, deleted, or unowned events render the route's not-found state. Unexpected data failures use the App Router error boundary.
