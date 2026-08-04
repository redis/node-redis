# Doc Coverage Checklist

Use this checklist to scan the selected scope (master = comprehensive, or current-branch diff) and validate documentation coverage.

## Feature inventory targets

- Public exports: clients (`RedisClient`, `RedisCluster`, `RedisSentinel`), pool, factory functions, types, and module entry points.
- Configuration options: `*Options` types, default config objects (`defaults.ts`), and connection-string options.
- New or changed commands under `packages/*/lib/commands` (names, args, reply shape, RESP2/RESP3 differences).
- User-facing behaviors: reconnection, timeouts, pub/sub, pipelining/transactions, scan iterators, errors, caching, telemetry, and data handling.
- Deprecations, removals, or renamed settings (track against migration guides `docs/v*-to-v*.md`).

## Doc-first pass (page-by-page)

- Review each relevant page under `docs/`, the top-level `README.md`, and each `packages/*/README.md`.
- Look for missing opt-in flags or customization options that the page implies.
- Add new features that belong on that page based on user intent and navigation.

## Code-first pass (feature inventory)

- Map features to the closest existing page based on package or feature area.
- Prefer updating existing pages over creating new ones unless the topic is clearly new.
- Use conceptual pages for cross-cutting concerns (auth, errors, RESP, clustering, pub/sub).
- Keep quick-start flows minimal; move advanced details into deeper pages.

## Evidence capture

- Record the master-branch file path and symbol/setting name.
- Note defaults or behavior-critical details for accuracy checks.
- Avoid large code dumps; a short identifier is enough.

## Red flags for outdated or incorrect docs

- Option names/types no longer exist or differ from code.
- Default values or allowed ranges do not match implementation.
- Features removed in code but still documented.
- New behaviors introduced without corresponding docs updates.

## When to propose structural changes

- A page mixes unrelated audiences (quick-start + deep reference) without clear separation.
- Multiple pages duplicate the same concept without cross-links.
- New feature areas have no obvious home in the docs structure.

## Diff mode guidance (current branch vs master)

- Focus only on changed behavior: new exports/options, modified defaults, removed features, or renamed settings.
- Use `git diff master...HEAD` (or equivalent) to constrain analysis.
- Document removals explicitly so docs can be pruned if needed.

## Patch guidance

- Keep edits scoped and aligned to existing tone and format.
- Update cross-links when moving or renaming sections.
- Place any runnable snippets under `examples/` or `doctests/`.
