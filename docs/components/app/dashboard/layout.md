# Organizer dashboard layout

Provides the signed-in navigation bar, Abeto brand mark, sign-out action, and responsive content container shared by organizer routes. It deliberately does not read the session at layout level so request-specific work stays inside page-level `Suspense` boundaries.

## Props

- `children`: route content rendered inside the dashboard frame.

## Usage

Next.js applies this layout to `/dashboard` and nested organizer routes.

## Interactions

The sign-out form invokes `signOutAction` and is keyboard accessible.
