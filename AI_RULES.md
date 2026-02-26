# AI_RULES.md

## Tech stack (quick facts)

- **React 19 + TypeScript** (functional components, hooks) for the UI.
- **Vite** for dev server and builds.
- **Supabase** via `@supabase/supabase-js` (client in `integrations/supabase/client.ts`) plus **Supabase Edge Functions** under `supabase/functions/*`.
- **ES Modules** (`"type": "module"` in `package.json`).
- **ESLint (Airbnb) + Prettier** for linting/formatting.
- **Node test runner** (`node --test ...`) for unit tests.
- **Playwright** available for end-to-end testing.
- Project-wide import alias **`@/`** maps to the repository root (see `tsconfig.json` and `vite.config.ts`).

## Library & implementation rules

### UI & React

- Prefer **small, focused functional components**.
- Put reusable UI pieces in `components/` (and use existing `components/ui/*` primitives where appropriate).
- Keep app state colocated; use **custom hooks** in `hooks/` for shared stateful logic.
- Use `context/UserContext.tsx` for current-user selection / identity concerns.

### Routing / navigation

- This app currently uses **tab/state-based navigation** inside `App.tsx` (no React Router).
- Do **not** introduce a routing library unless a feature truly requires URLs/deep-linking.

### Styling

- Prefer the existing **design tokens** from `design-system/tokens.ts` for colors/spacing/typography.
- Follow the established pattern in `App.tsx` and components: **inline style objects + tokens**, plus targeted CSS files where already used (e.g. `components/**/**/*.css`).
- Do not add Tailwind/shadcn/Radix-based styling patterns unless the project is explicitly migrated to them.

### Data access (Supabase)

- Import the Supabase client only from:
  - `@/integrations/supabase/client`
- Keep database/network logic in `services/*` (e.g. `movieService.ts`, `messageService.ts`) and call those from hooks/components.
- Prefer typed DB access using the generated types in `integrations/supabase/types.ts`.

### “AI” / external API calls

- Centralize LLM-related logic in `services/geminiService.ts` and related helpers.
- If secrets are needed, route requests through **Supabase Edge Functions** (never expose private keys in the client).

### Testing

- Add unit tests alongside the relevant module when changing core logic (e.g. `services/*.test.ts`, `components/**/**/*.test.ts`).
- Use Node’s built-in test runner patterns consistent with existing tests.

### Dependencies

- Prefer **existing** utilities/components in the repo.
- Avoid adding new third‑party dependencies unless it materially reduces complexity and is used in multiple places.
