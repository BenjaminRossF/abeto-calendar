# Root error state

This client error boundary displays a safe recovery message for unexpected route failures and retries the segment with Next.js `retry()`.

## Props

- `error`: runtime error supplied by the App Router; logged in the browser for debugging.
- `retry`: Next.js recovery function.

## Usage

Next.js renders this boundary after an uncaught error in the root route segment.

## States

The UI does not show internal error details and offers an explicit retry action.
