# AfriScout Web

React + TypeScript + Vite + Tailwind + Zustand front end for AfriScout.

## Scripts

- `npm run dev` - start the Vite dev server on port 5173
- `npm run build` - typecheck and build for production
- `npm run preview` - preview the production build on port 4173
- `npm run typecheck` - TypeScript only, no emit
- `npm run lint` - ESLint
- `npm run test` - Vitest

## Structure

- `public/` static assets served as-is
- `src/assets/` fonts, icons, illustrations imported by the app
- `src/components/` all UI: primitives, layout, navigation, domain components
- `src/pages/` route-level pages grouped by audience
- `src/layouts/` route-level layout shells
- `src/hooks/` reusable React hooks
- `src/services/` API clients
- `src/stores/` Zustand stores
- `src/types/` front-end type definitions
- `src/utils/` pure utility functions
- `src/styles/` CSS tokens, base, utilities, animations
- `src/routes/` route tree
- `src/config/` environment, navigation, categories, countries, currencies

## Environment

Only `VITE_*` variables are exposed to the browser. No secrets here, ever.
See `.env.example` at the repository root.