# Sign-in and registration page

This server-rendered entry page introduces Abeto Calendar and provides organizer sign-in and account creation. It reads the current session inside a `Suspense` boundary and redirects an authenticated user to `/dashboard`.

## Props

The page is a route entry point and takes no application-specific props.

## Usage

Open `/` to sign in or create an organizer account. The interactive form calls the Server Actions in `app/actions/auth.ts`.

## States and interactions

- A structure-matched fallback appears while the server reads the session.
- The form switches between sign-in and account creation.
- Errors are announced accessibly and preserve entered values.
- Submitting disables the action and exposes a pending label.
