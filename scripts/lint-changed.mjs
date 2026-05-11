import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Incremental lint gate for this monorepo.
 *
 * CI runs this on pull requests and lints only files changed by the PR, so we
 * can enforce linting on new work without fixing the whole repository at once.
 * Local runs lint staged, unstaged, and untracked files.
 *
 * Use `--base <sha-or-ref> [--head <sha-or-ref>]` to reproduce a CI-style
 * merge-base diff.
 */
const lintableFilePattern = /\.(?:cjs|js|mjs|ts)$/u;
const ignoredPathPattern = /(^|\/)(coverage|dist|documentation|junit-results|node_modules)\//u;
const eslintBin = fileURLToPath(new URL('../node_modules/eslint/bin/eslint.js', import.meta.url));

function git(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8'
  });

  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }

  return result.stdout.trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    base: undefined,
    head: 'HEAD'
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === '--base') {
      options.base = args[++index];
    } else if (arg === '--head') {
      options.head = args[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function getGitHubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath || !existsSync(eventPath)) {
    return {};
  }

  return JSON.parse(readFileSync(eventPath, 'utf8'));
}

function ensureCommitAvailable(ref) {
  const exists = spawnSync('git', ['cat-file', '-e', `${ref}^{commit}`], {
    stdio: 'ignore'
  });

  if (exists.status === 0) {
    return;
  }

  const fetch = spawnSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', ref], {
    encoding: 'utf8',
    stdio: ['ignore', 'inherit', 'pipe']
  });

  if (fetch.status !== 0) {
    throw new Error(fetch.stderr.trim() || `Unable to fetch ${ref}`);
  }
}

function uniqueLines(output) {
  return output
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function changedFilesBetween(base, head) {
  ensureCommitAvailable(base);
  ensureCommitAvailable(head);

  return uniqueLines(git([
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    `${base}...${head}`
  ]));
}

function changedFilesInWorkingTree() {
  return [
    ...uniqueLines(git(['diff', '--name-only', '--diff-filter=ACMR'])),
    ...uniqueLines(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])),
    ...uniqueLines(git(['ls-files', '--others', '--exclude-standard']))
  ];
}

function getCandidateFiles(options) {
  if (options.base) {
    return changedFilesBetween(options.base, options.head);
  }

  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    const pullRequest = getGitHubEvent().pull_request;
    const baseSha = pullRequest?.base?.sha;
    const headSha = pullRequest?.head?.sha;

    if (!baseSha || !headSha) {
      throw new Error('Unable to determine pull request base and head SHAs');
    }

    return changedFilesBetween(baseSha, headSha);
  }

  return changedFilesInWorkingTree();
}

function getLintableFiles(files) {
  return [...new Set(files)]
    .filter(file => lintableFilePattern.test(file))
    .filter(file => !ignoredPathPattern.test(file));
}

const options = parseArgs();
const lintableFiles = getLintableFiles(getCandidateFiles(options));

if (lintableFiles.length === 0) {
  console.log('No changed JavaScript or TypeScript files to lint.');
  process.exit(0);
}

console.log(`Linting ${lintableFiles.length} changed file(s):`);
for (const file of lintableFiles) {
  console.log(`- ${file}`);
}

const lint = spawnSync(process.execPath, [
  eslintBin,
  '--max-warnings=0',
  ...lintableFiles
], {
  stdio: 'inherit'
});

process.exit(lint.status ?? 1);
