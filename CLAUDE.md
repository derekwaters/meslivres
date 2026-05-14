# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start Next.js dev server (localhost:3000)
npm run build    # Build production bundle
npm run start    # Run production server
npm run lint     # Run ESLint checks
```

**Note:** This project uses Next.js 16.2.6 (with potential breaking changes). Read the Next.js documentation in `node_modules/next/dist/docs/` before implementing features or see AGENTS.md for more context.

## Project Structure

- **src/app/** - Next.js App Router (pages, layouts, styles)
- **public/** - Static assets
- **src/** - Source code root with `@/*` path alias pointing here
- **next.config.ts** - Next.js configuration (currently empty)
- **tsconfig.json** - TypeScript configuration with path aliases
- **eslint.config.mjs** - ESLint config extending Next.js rules (flat config format)

## Key Technologies

- **Framework:** Next.js 16.2.6 with App Router
- **UI Library:** React 19.2.4
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + PostCSS
- **Linting:** ESLint 9 (flat config format)
- **Fonts:** Next.js Google Fonts (Geist)

## Architecture Notes

This is a fresh Next.js project from `create-next-app`. Current structure is minimal:
- Root layout in `src/app/layout.tsx` imports global styles and configures fonts
- Home page at `src/app/page.tsx`
- No custom server logic, API routes, or components yet

The path alias `@/*` resolves to `src/*`, allowing cleaner imports (e.g., `@/components/Button`).

## TypeScript Configuration

- **Target:** ES2017
- **Strict mode:** Enabled
- **Module resolution:** Bundler (supports modern ESM)
- **Isolated modules:** Enabled (required by Next.js)
- **Path alias:** `@/*` → `./src/*`

## Testing

No test runner is configured. Tests would typically be added via `vitest`, `jest`, or another framework.

## Development Notes

- Uses modern ESLint flat config format (ESLint 9+)
- Tailwind CSS v4 configured with PostCSS
- Dark mode classes available in templates (e.g., `dark:bg-black`)
- Auto-refresh on file changes in dev mode
