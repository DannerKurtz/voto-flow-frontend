# Voto Flow Frontend Guide

## Mission

Build the Voto Flow web interface for following the official results of Brazil's 2026 General Elections. It serves roughly ten concurrent users and must make official data clear, accurate, accessible, and reliable without adding unnecessary client-side complexity.

The frontend must never request TSE resources directly. It consumes initial state and future real-time updates exclusively through the Voto Flow backend.

## Development Boundaries

The project progresses only through explicitly authorized phases. Do not start a later phase, create implementation code, install dependencies, define client contracts, or introduce routes and real-time protocols until its phase has been approved.

Current status:

- Phase 1 — Official TSE research: completed.
- Next authorized analysis phase: Phase 2 — Electoral Domain.
- Frontend implementation remains unauthorized until Phase 10 receives explicit approval.

## Technology Direction

Use Next.js, React, TypeScript, and Tailwind CSS when frontend implementation is authorized. Apply Build Web Apps only during an explicitly authorized frontend phase and only when it provides a concrete benefit.

Do not select an application router structure, state-management library, component library, REST client, WebSocket client, or visual-design system before the corresponding architecture and communication phases have been completed.

## Backend Boundary

The backend owns TSE access, polling, validation, normalization, persistence, cache behavior, and integrity verification. The frontend must not recreate those responsibilities or construct TSE URLs.

The future delivery model is expected to load current state from the backend and then receive later scoped updates over a backend-defined real-time channel. This remains a direction, not a protocol definition, until the Communication phase is approved.

## Official Result Presentation

Use the official data supplied by the backend as the sole result source. Preserve the official labels, situation, classification, vote totals, percentages, scope, and update times provided by the backend.

The supported offices are President, Governor, Senator, Federal Deputy, State Deputy, and District Deputy where applicable. Municipal offices are out of scope.

For proportional offices, never present a candidate as elected merely because of vote order. Use the official TSE-derived status or classification supplied by the backend when available.

Do not invent figures, derive undisclosed electoral information, or hide distinctions among valid, sub judice, annulled, blank, and null votes when those distinctions are provided by the official data.

## Future User Experience Direction

When implementation is authorized, users should be able to choose an office and its appropriate geographic scope, such as President for Brazil or Governor for a UF.

The interface may later show candidate identity, number, party, photo, votes, percentage, official result status, totalization percentage, totalized sections, last update, and real-time connection status only when the backend provides those official fields.

Support clear loading, empty, unavailable, stale, error, and disconnected states. Keep updates scoped to the active office and geography so an unrelated result does not disturb the current view.

## Future Quality Requirements

When implementation is authorized:

- Use accessible semantic HTML, keyboard-operable controls, and legible result presentation.
- Build responsive views suitable for desktop and mobile screens.
- Keep server and client responsibilities explicit; do not duplicate backend result logic in components.
- Test rendering, loading, errors, connection changes, and scoped updates with backend fixtures or mocks, never by calling live TSE services from the browser.
- Validate visual behavior and interaction flows only after frontend architecture and data contracts are defined.

## Change Discipline

Before making a significant frontend architecture decision, document the problem, viable alternatives, trade-offs, recommendation, and justification. Prefer the simplest user experience that faithfully represents the official data and remains easy to maintain.

Do not commit, push, create branches, open pull requests, or publish changes unless explicitly requested.
