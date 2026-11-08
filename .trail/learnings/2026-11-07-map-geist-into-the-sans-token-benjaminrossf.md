---
title: Map Geist into the sans token
author: BenjaminRossF
date: 2026-11-07
branch: master
id: l-da168fc7
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - README.md
  - app/globals.css
  - app/layout.tsx
  - app/page.tsx
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
---

## Decided
Map the Tailwind sans and heading tokens to the Geist CSS variable loaded by the root layout.

## Tried and ruled out
The font was not missing: Next.js loaded Geist, but the theme token referenced itself and was invalid.

## Watch out
A self-referential font mapping in `@theme inline` can silently make the browser fall back to its default serif while the application still compiles.

## In the code
`app/layout.tsx` defines `--font-geist-sans` with `next/font/google`; `app/globals.css` must map `--font-sans` and `--font-heading` to that variable.
