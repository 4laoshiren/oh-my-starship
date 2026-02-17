# CLAUDE.md

This file provides guidance for AI/code agents working in this repository.

## Project Overview

This is a Tauri v2 desktop app for managing Starship prompt configuration on Windows.
The current frontend is React, but this project is being refactored to Vue.

Primary goals during refactor:

- Keep existing features and behavior unchanged unless explicitly requested
- Replace React architecture with Vue 3 architecture incrementally
- Keep Tauri Rust commands stable and frontend-framework-agnostic

## Target Tech Stack (Vue Refactor)

- Frontend: Vue 3 + TypeScript + Vite
- Router: Vue Router 4
- State: Pinia
- Data Fetching: @tanstack/vue-query
- Forms: vee-validate + zod
- I18n: vue-i18n
- Styling: Tailwind CSS v4
- UI Components: shadcn-vue
- Backend: Rust + Tauri v2
- Package Manager: pnpm (required)

## Development Commands

```bash
# Install dependencies
pnpm install

# Run desktop app (frontend + tauri)
pnpm tauri dev

# Run frontend only
pnpm ui:dev

# Build desktop app
pnpm tauri build

# Build frontend only
pnpm ui:build

# Check format
pnpm format:check

# Fix format
pnpm format:write

# Type check
pnpm tsc --noEmit
```

## Target Frontend Structure

Use this structure for the Vue migration:

- `src/main.ts` - Vue app entry
- `src/App.vue` - root component
- `src/router/index.ts` - route definitions
- `src/stores/` - Pinia stores
- `src/composables/` - reusable Vue composables
- `src/services/api.ts` - domain-level service layer
- `src/services/cmds.ts` - Tauri invoke wrappers
- `src/views/` - route pages
- `src/components/` - shared Vue components
- `src/components/ui/` - reusable UI primitives
- `src/i18n/` - localization setup and locale files
- `src/types.ts` - shared TypeScript types

## Backend (Tauri/Rust) Structure

- `src-tauri/src/main.rs` - app entry
- `src-tauri/src/lib.rs` - Tauri app setup/plugins
- `src-tauri/src/commands.rs` - file operations and core commands

Rust command contracts should remain stable while frontend is being migrated.

## Architecture Rules

1. Use Vue SFC with `<script setup lang="ts">` by default.
2. Do not introduce new React code for new features.
3. Migrate feature-by-feature (route-by-route), and keep each migrated feature fully working.
4. Keep Tauri command calls centralized in `src/services/cmds.ts`.
5. Keep async server/state logic in composables or Vue Query hooks, not in template-heavy components.
6. Keep validation on the frontend before write/save operations.
7. Preserve i18n keys and user-visible behavior unless change is requested.
8. Prefer small, testable functions for TOML transformation and parsing logic.

## Migration Guidelines

1. First migrate app shell (main entry, app container, router).
2. Then migrate shared infra (theme, i18n, services, query layer).
3. Migrate pages one by one:
   - Home
   - Config list
   - Starship module editor
   - TOML editor
   - Settings
4. After each page migration, run type check and smoke test.
5. Remove React-only dependencies only after all related code is migrated.

## Code Principles

- Keep TypeScript strict and explicit at module boundaries.
- Use named exports for utilities and services.
- Keep side effects isolated in composables/services.
- Avoid giant components; split by responsibility when needed.
- Maintain readable naming for Tauri commands and frontend actions.
- Do not use `pnpm tauri dev` as a replacement for type check; run `pnpm tsc --noEmit`.
- Do not use any `export default` or  `export const`. Only use `export`.
- Do not use `index.ts` to export components uniformly. Only export components at the end of each component file.
- Variants and method should be named using snake_case. Classes should be named using CamelCase.
- Always use `const props = defineProps([x, y])` while using defineProps. Always use `props.x` while using prop.
- Always use `reactive` instead of `ref`. While using 'reactive', always follow this template: `const state = reactive({})`. Always use `state.variants` while using variants defined by reactive.
- Do not any shorthand like `:` for `v-bind`.
- Always assign an argument while using `v-model`.


## Important Notes

- Enterprise config files are read-only.
- All file operations should use async/await.
- Preserve backup behavior and filename strategy.
- Keep Windows path handling robust and explicit.
- Do not use `--yes` for shadcn-related component installation commands.
