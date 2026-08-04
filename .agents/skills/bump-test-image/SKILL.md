---
name: bump-test-image
description: Bump the default Redis docker test image (redislabs/client-libs-test) in the shared DEFAULT_DOCKER_CONFIG and the CI matrix, then force-push the bump-test-image branch and open a PR against upstream. User-invoked only.
disable-model-invocation: true
argument-hint: <image-tag> [redis-version]
---

# Bump default docker test image

Updates the default `redislabs/client-libs-test` docker tag used by tests (a single shared config in `@redis/test-utils`), adjusts the CI matrix, commits on a freshly-reset `bump-test-image` branch, force-pushes it, and opens (or updates) a PR against `redis/node-redis` master.

## Inputs

- **tag** (required): the new docker tag, e.g. `8.8.0`, `8.8-rc1`, `custom-28772936538-debian`, `unstable-24425681442-debian`. If given as `redislabs/client-libs-test:<tag>`, strip the image name.
- **version** (sometimes required): the Redis version the tag represents, e.g. `8.10`.
  - Derivable when the tag is version-shaped: `8.8.0` → `8.8`, `8.8-rc1` → `8.8`, `8.8-m03` → `8.8`.
  - NOT derivable for `custom-*` / `unstable-*` tags — if missing, ask the user which Redis version the tag maps to before doing anything else.

If no tag was given at all, ask for it and stop.

## Step 1 — Sync master from upstream

Remotes: `upstream` = `redis/node-redis` (canonical), `origin` = the user's fork.

```bash
git fetch upstream
git rev-parse --abbrev-ref HEAD   # remember current branch
```

Update local master to upstream:

- If currently on master: `git reset --hard upstream/master` (only if working tree is clean — if dirty, stop and tell the user).
- Otherwise: `git fetch upstream master:master` (fails safely if master has local-only commits; if it fails, stop and report).

## Step 2 — Reset the work branch

```bash
git checkout -B bump-test-image master
```

`-B` creates or hard-resets the branch to latest master. Any previous bump commits on it are intentionally discarded (the branch is recycled for each bump; force-push later matches this).

## Step 3 — Edit the shared default config

The default image config lives in exactly ONE place:

`packages/test-utils/lib/index.ts` → `DEFAULT_DOCKER_CONFIG`:

```typescript
export const DEFAULT_DOCKER_CONFIG: TestUtilsConfig = {
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageTagArgument: 'redis-tag',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: { tag: '<old-tag>', version: '<old-version>' }
};
```

Note the old tag/version, then replace them with the new values on the `defaultDockerVersion` line. Nothing else in the file changes.

If `DEFAULT_DOCKER_CONFIG` does not exist in that file (e.g. master predates the dedupe refactor), STOP and tell the user — do not fall back to editing per-package test-utils files without confirmation.

## Step 4 — Update the CI matrix

File: `.github/workflows/tests.yml`, `matrix` → `redis` entries of the form:

```yaml
          - tag: "8.8.0"
            version: "8.8"
```

Two cases, decided by comparing the new `version` with the old default version from Step 3:

1. **New Redis version** (e.g. default moves 8.8 → 8.10): **add** a new `- tag/version` entry at the end of the matrix list, keeping the previous entry so CI retains coverage of the prior version.
2. **Same Redis version** (rc → GA, or a newer custom build of the same version): **replace** the `tag` of the existing entry for that version; the `version` line stays.

## Step 5 — Verify

```bash
grep -rn "defaultDockerVersion:" packages --include="*.ts" | grep -v dist | grep -v node_modules
```

Exactly one config line (in `packages/test-utils/lib/index.ts`) must show the new tag/version; any other hits are the type definition / JSDoc examples, not real defaults. Also confirm `git diff --stat` touches exactly 2 files: `packages/test-utils/lib/index.ts` + `.github/workflows/tests.yml`.

## Step 6 — Commit

Fill in this template exactly (Conventional Commits):

```
chore(tests): bump default docker test image to <X>

Bump the default Redis test image from <old-tag> to <new-tag> (Redis
<version>) in DEFAULT_DOCKER_CONFIG, and <matrix-action> the CI matrix.
```

- `<X>`: the human-meaningful version when the tag is version-shaped (`8.10`, `8.8.0`, `8.8-rc1`, `8.8-m03`); the full tag for `unstable-*` builds; the version for `custom-*` tags (the actual tag already appears in the body as `<new-tag>`).
- `<matrix-action>`: either `add an <version> entry to` (keeping prior-version coverage) or `update the <version> entry in`, matching what Step 4 did.

Example:

```
chore(tests): bump default docker test image to 8.10

Bump the default Redis test image from 8.8.0 to custom-28772936538-debian
(Redis 8.10) in DEFAULT_DOCKER_CONFIG, and add an 8.10 entry to the CI
matrix.
```

Keep any company-internal references (Jira/Confluence IDs, internal links) out of the commit and PR.

## Step 7 — Force-push and PR

```bash
git push -f origin bump-test-image
```

Then check for an existing open PR before creating one:

```bash
gh pr list --repo redis/node-redis --head <fork-owner>:bump-test-image --state open
```

(`<fork-owner>` = GitHub owner from the `origin` remote URL.)

- If a PR exists, the force-push already updated it — just report the URL. Update its title/body via `gh pr edit` to match the new tag.
- Otherwise create one:

```bash
gh pr create --repo redis/node-redis --base master --head <fork-owner>:bump-test-image \
  --title "<commit subject>" \
  --body "<commit body>"
```

Finish by reporting: old → new tag/version, matrix action taken (added vs replaced entry), and the PR URL.
