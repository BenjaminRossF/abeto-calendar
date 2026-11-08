# New event page

The server page starts the session read and passes its promise to the route content under `Suspense`. The content waits at `io()` before calculating today's Chile date, keeping the request-time clock outside the static shell while the form-shaped skeleton is shown. It redirects unauthenticated visitors to sign-in and renders the event creation form with that date.

## Props

The route takes no application-specific props.

## Usage

Open `/dashboard/new` from the organizer dashboard.

## Loading and error states

A form-shaped skeleton appears while the session is checked. Validation and persistence errors are displayed by the form while preserving its input.
