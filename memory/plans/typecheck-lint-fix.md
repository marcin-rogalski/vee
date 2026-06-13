# Fix Typecheck & Lint Errors

## Scope
- 139 TypeScript errors across 22 files
- 4 lint errors in 1 file (`CLI.unit.test.ts`)

## Plan

### Phase 1: Infrastructure / Module Resolution (5 errors, 2 files)
- Fix wrong relative import paths in `CLI.ts` (3 paths)
- Fix wrong relative import paths in `App.tsx` (3 `.js` extensions)
- Install `utility-types` package or remove import

### Phase 2: tsconfig (2 errors, 1 file)
- Fix `cli.ts` top-level await by updating `tsconfig.json` module/target

### Phase 3: Production Code Type Fixes (15 errors, 7 files)
- `AgentsDelete.command.ts`: `import type` → `import` for `Command`
- `client.ts`: Add missing `Agent` properties, fix `exactOptionalPropertyTypes`
- `AgentsUpsert.command.ts`: Add missing `Agent` properties
- `Help.command.ts`: Fix constructor args
- `Health.adapter.test.ts`: Fix constructor args, add null guard
- `ProviderUpsert.adapter.test.ts`: Fix constructor args
- `ConfigScreen.tsx`: Rename conflicting `Client`, fix `exactOptionalPropertyTypes`
- `SessionScreen.tsx`: Add `createdAt` to session state

### Phase 4: Test Code Mock Types (38 errors, 13 files)
- Fix mock method type annotations (plain function → mock type) in 9 adapter test files
- Fix `useMockState` signature in `ConfigScreen.test.tsx` and `SessionScreen.test.tsx`
- Fix `HTMLProps` usage in 3 screen test files
- Fix `Client` cast issues in 3 screen test files
- Add `onSelect` to `SessionList` props
- Fix `EventTarget` casting for `value`
- Handle `null` → `string | undefined`
- Fix spread types (non-object)
- Add `dom` to tsconfig lib
- Fix `Instance.exit` API
- Add public getters to `ExpressServer`

### Phase 5: CLI.unit.test.ts (15 errors + 4 lint)
- Consolidate `MockCommand` interface (remove duplicate property assignments)
- Fix chainability (return `Command` not `MockCommand`)
- Use public accessors for private members
- Fix `Record` construction
- Fix `as any` (use `as const` or suppress)

## Walking Skeleton
After fixes: `tsc --noEmit` passes with 0 errors, `biome check` passes with 0 errors.

## Dependencies
- Phase 1 must complete before others (module resolution blocks compilation)
- Phase 2 (tsconfig) needed by Phase 1 (cli.ts top-level await)
- Phases 3-5 can proceed in parallel once Phase 1-2 are done
