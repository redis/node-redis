# Command Registry JSDoc Plan (Revised Direction)

## Goal
Keep command JSDoc only in command registry `index.ts` files. Command implementation files should not carry command-level JSDoc anymore.

## Source of Truth
Registry export entries are the only source of command documentation:
- `packages/client/lib/commands/index.ts`
- `packages/json/lib/commands/index.ts`
- `packages/search/lib/commands/index.ts`
- `packages/time-series/lib/commands/index.ts`
- `packages/bloom/lib/commands/bloom/index.ts`
- `packages/bloom/lib/commands/count-min-sketch/index.ts`
- `packages/bloom/lib/commands/cuckoo/index.ts`
- `packages/bloom/lib/commands/t-digest/index.ts`
- `packages/bloom/lib/commands/top-k/index.ts`

## Migration
1. Ensure every exported command entry in the registries above has a JSDoc block.
2. Remove `@param parser` from registry JSDoc (user-facing docs should not mention internal parser details).
3. Remove command-level JSDoc from command implementation files (`packages/*/lib/commands/**/*.ts`, excluding registry `index.ts` files), specifically the JSDoc attached to `parseCommand`.
4. Keep docs in place at registry level only.

## Tooling
1. Remove the one-time move script from the repo:
   - delete `scripts/sync-command-jsdoc.ts`
   - remove `sync-jsdoc` from root `package.json`
2. Keep only `check:command-jsdoc`, implemented as a simple line/regex checker:
   - no TypeScript AST usage
   - checks only the 9 hardcoded registry files above
   - validates that each command export entry has an attached JSDoc block
3. Check script ignores command implementation files and does not enforce parser-param policy (parser cleanup is migration-only).

## Validation
1. `npm run check:command-jsdoc` must fail if any registry command entry is missing JSDoc.
2. `npm run check:command-jsdoc` must pass once migration is complete.
3. `npm run build` must pass.
4. `git diff --check` must pass (no trailing whitespace issues in updated registry files).
