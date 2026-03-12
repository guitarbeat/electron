# Tech Stack

## Core Technologies

- **React 19** with TypeScript
- **Vite 7** for build tooling and dev server
- **Express** backend for API proxy (OMDb metadata)
- **pnpm** package manager

## Development Tools

- **ESLint** with Airbnb config + TypeScript
- **Prettier** for code formatting
- **TypeScript 5.9** with strict configuration

## Build & Dev Commands

```bash
# Development
pnpm run dev              # Start both client (Vite) and server (Express)
pnpm run dev:client       # Vite dev server only (port 5000)
pnpm run dev:server       # Express server only (port 3001)

# Build
pnpm run build            # Production build
pnpm run build:dev        # Development mode build
pnpm run preview          # Preview production build

# Quality
pnpm run lint             # ESLint check
pnpm run format           # Prettier format
pnpm run check-types      # TypeScript type checking
pnpm run test:all         # Run all tests

# Utilities
pnpm run check:case-collisions  # Check for case-sensitive file issues
```

## Code Style

- **Prettier**: 2 spaces, single quotes, 100 char line width, trailing commas (ES5)
- **ESLint**: Airbnb base with relaxed rules for existing codebase
- **Components**: Function declarations or arrow functions allowed
- **Imports**: Path aliases via `@/*` for cleaner imports
- **TypeScript**: No explicit `any` warnings, unused vars allowed

## Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:
- `@/common` → `src/components/common`
- `@/ui` → `src/components/ui`
- `@/hooks` → `src/hooks`
- `@/services` → `src/services`
- `@/context` → `src/context`
- `@/utils` → `src/utils`
- `@/*` → `src/*` (fallback)

## Server Configuration

- **Dev server**: Port 5000 (Vite)
- **API proxy**: Port 3001 (Express) → `/api` routes proxied from client
- **Hot reload**: Enabled for both client and server (`--watch` flag)
