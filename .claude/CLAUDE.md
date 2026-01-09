# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Test, and Development Commands

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm test         # Run Vitest once
pnpm test -- --watch           # Vitest watch mode
pnpm test -- path/to/file.test.ts  # Run single test file
pnpm emulator     # Start Firebase emulators with data import/export
pnpm emulator:kill  # Kill running emulator processes
```

## Architecture Overview

Bobby is a Next.js 16 + React 19 application for children to practice emergency phone calls via voice interaction with Deepgram.

### Directory Structure
- `app/` - Next.js App Router with `[locale]` dynamic segment for i18n
- `app/api/` - API routes: auth, conversation, checkout, credits, webhooks
- `components/` - PascalCase React components
- `lib/` - Domain logic, Firebase clients, analytics, rate limiting, validation
- `hooks/` - Custom hooks (`useX` naming); includes `mutations/` and `queries/` for React Query
- `context/` - React context providers (Auth, Credits, Deepgram, Microphone, UserData)
- `schemas/` - Zod validation schemas
- `types/` - Shared TypeScript types
- `i18n/` + `messages/` - Localization setup and message catalogs
- `__tests__/` - Tests organized by `unit/`, `integration/`, `e2e/`

### Key Technologies
- **Next.js 16** with App Router, React Compiler, Turbopack
- **React 19** with strict mode
- **Firebase** (Auth, Firestore, Storage) - rules in `firestore.rules`, `storage.rules`
- **Deepgram** for voice transcription via WebSocket
- **Stripe** for payments
- **React Query** for server state
- **next-intl** for internationalization with localized pathnames
- **Upstash Redis** for distributed rate limiting (falls back to in-memory)

### Firebase Architecture
- **Client-side** (`lib/firebase.ts`, `lib/firebase-client.ts`): Used in React components for auth state and Firestore reads
- **Server-side** (`lib/firebase-admin.ts`): Admin SDK for API routes - token verification, privileged Firestore operations
- Local development uses Firebase emulators; data persists in `emulator-data/`

### Provider Hierarchy
The app layout (`app/[locale]/app/layout.tsx`) wraps authenticated pages with:
`AuthProvider` → `CreditsProvider` → `UserDataProvider` → `ClientProviders` → `ProtectedRoute`

### API Route Patterns
API routes use consistent patterns:
1. Extract and validate Bearer token via `extractAndValidateToken()`
2. Verify with Firebase Admin SDK via `verifyIdToken()`
3. Apply rate limiting via `rateLimiters.*` (pre-configured for auth, api, strict, etc.)
4. Return proper status codes with `NextResponse.json()`

### Internationalization
Routes use `[locale]` segment with `next-intl`. Localized pathnames defined in `i18n/routing.ts` (e.g., `/login` → `/logowanie` for Polish).

## Coding Conventions

- TypeScript strict mode enabled
- Use `@/` path alias for imports
- Components: PascalCase files; hooks: `useX` naming
- Tests: `*.test.ts(x)` or `*.spec.ts(x)`
- Prettier: 2-space indent, single quotes, semicolons, 80 cols
- Commit messages: short, sentence-case descriptions without prefixes

## React Guidelines

Before React/Next.js feature work, follow the approach in `docs/react-code-task-prompt.md`:

1. Ask clarifying questions first (intent, constraints, edge cases)
2. Critique the plan before implementing (risks, alternatives)
3. Then implement

Key principles:
- Favor composition and `children`-first APIs over large prop surfaces
- Keep logic outside React when possible; extract pure functions
- State should live close to its usage
- Avoid `useEffect` unless syncing with external systems
- Derive state rather than storing computed values

## Testing

Vitest runs in jsdom with setup in `__tests__/setup.ts`. Coverage targets:
- `lib/**/*.ts`
- `app/api/**/*.ts`
- `components/**/*.tsx`
