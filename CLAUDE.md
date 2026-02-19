# CLAUDE.md

This file provides guidance for AI/code agents working in this repository.

## Project Overview

This is a Tauri v2 desktop app for managing Starship prompt configuration on Windows.
The frontend uses Vue 3 with Nuxt UI as the component library.

Primary goals:

- Keep existing features and behavior unchanged unless explicitly requested
- Keep Tauri Rust commands stable and frontend-framework-agnostic

## Tech Stack

- Frontend: Vue 3 + JavaScript + Vite
- Router: Vue Router
- State: Pinia
- Data Fetching: @tanstack/vue-query
- I18n: vue-i18n
- Styling: Tailwind CSS v4 (via @nuxt/ui)
- UI Components: Nuxt UI (standalone, via @nuxt/ui/vite plugin)
- Icons: Iconify (via Nuxt UI, using i-lucide-xxx notation)
- Toast: useToast() composable (via Nuxt UI)
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

# Code check
pnpm ui:build
```

## Frontend Structure

- `src/main.js` - Vue app entry (registers Nuxt UI plugin)
- `src/App.vue` - root component (wraps in UApp + UToaster)
- `src/router/index.js` - route definitions
- `src/stores/` - Pinia stores
- `src/composables/` - reusable Vue composables
- `src/services/api.js` - domain-level service layer
- `src/services/cmds.js` - Tauri invoke wrappers
- `src/views/` - route pages
- `src/components/` - shared Vue components
- `src/components/ui/` - custom UI primitives (ColorPickerInput only)
- `src/i18n/` - localization setup and locale files
- `src/types.js` - shared JavaScript types

## Backend (Tauri/Rust) Structure

- `src-tauri/src/main.rs` - app entry
- `src-tauri/src/lib.rs` - Tauri app setup/plugins
- `src-tauri/src/commands.rs` - file operations and core commands

Rust command contracts should remain stable while frontend is being migrated.

## Architecture Rules

1. Use Vue SFC with `<script setup>` by default.
2. Keep Tauri command calls centralized in `src/services/cmds.js`.
3. Keep async server/state logic in composables or Vue Query hooks, not in template-heavy components.
4. Keep validation on the frontend before write/save operations.
5. Preserve i18n keys and user-visible behavior unless change is requested.
6. Prefer small, testable functions for TOML transformation and parsing logic.
7. Nuxt UI components (UButton, UInput, UModal, etc.) are auto-imported - do not add explicit imports for them.
8. Use `useToast()` composable (auto-imported) for toast notifications with `toast.add({ title, color })`.
9. Use `UIcon` with Iconify notation (e.g., `i-lucide-settings`) instead of importing icon components.

## Code Principles

- Keep JavaScript strict and explicit at module boundaries.
- Use named exports for utilities and services.
- Keep side effects isolated in composables/services.
- Avoid giant components; split by responsibility when needed.
- Maintain readable naming for Tauri commands and frontend actions.
- Do not use `pnpm tauri dev` as a replacement for code check; run `pnpm ui:build`.
- Do not use any `export default` or  `export const`. Only use `export`.
- Do not use `index.js` to export components uniformly. Only export components at the end of each component file.
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
- ColorPickerInput is the only custom UI component (Nuxt UI does not provide an equivalent hex color input widget).
- Nuxt UI CSS variables use the `--ui-` prefix (e.g., `--ui-border`, `--ui-bg-elevated`, `--ui-text-muted`, `--ui-primary`).
