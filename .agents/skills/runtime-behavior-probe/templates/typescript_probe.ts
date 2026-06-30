import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/**
 * Disposable probe workflow for node-redis:
 * 1. Put this file in a temporary directory created with `mktemp -d`.
 * 2. Add a sibling `tsconfig.json` that extends `${process.cwd()}/tsconfig.base.json`
 *    and includes only `./probe.ts`.
 * 3. From the repository root, run `npx tsc --noEmit -p /tmp/.../tsconfig.json`.
 * 4. If that passes, run `npx tsx /tmp/.../probe.ts`.
 * 5. Only switch to `dist/` imports and `npm run build` when packaged output is the thing under test.
 */

type ProbeMode = 'single-shot' | 'repeat-N' | 'warm-up + repeat-N';
type ResultFlag = 'unexpected' | 'negative' | 'expected' | 'blocked';

type CaseResult = {
  case_id: string;
  mode: ProbeMode;
  is_warmup: boolean;
  observation_summary: string;
  result_flag: ResultFlag;
  metrics: Record<string, unknown>;
  error: string | null;
  total_latency_s?: number;
  first_token_latency_s?: number;
};

const SCENARIO = 'replace-me';
const RUN_LABEL = 'replace-me';
const MODE: ProbeMode = 'single-shot';
const APPROVED_ENV_VARS: string[] = [];
const OUTPUT_DIR_ENV = 'PROBE_OUTPUT_DIR';

const RESULTS: CaseResult[] = [];
const repoRequire = createRequire(join(process.cwd(), 'package.json'));

function gitValue(...args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    return 'unknown';
  }
  const value = result.stdout.trim();
  return value || 'unknown';
}

function outputDir(): string | null {
  const value = process.env[OUTPUT_DIR_ENV];
  return value ? resolve(value) : null;
}

function writeJson(path: string, payload: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function emit(kind: string, payload: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: Number((Date.now() / 1000).toFixed(3)),
      kind,
      ...payload,
    }),
  );
}

function findNearestPackageJson(startPath: string): string | null {
  let current = resolve(startPath);
  while (true) {
    const candidate = join(current, 'package.json');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function resolvePackageVersion(packageName: string): string | null {
  try {
    const packageJsonPath = repoRequire.resolve(`${packageName}/package.json`);
    return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version ?? null;
  } catch {
    try {
      const entryPath = repoRequire.resolve(packageName);
      const packageJsonPath = findNearestPackageJson(resolve(entryPath, '..'));
      if (!packageJsonPath) {
        return null;
      }
      return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version ?? null;
    } catch {
      return null;
    }
  }
}

export async function importRepoModule(
  repoRelativePath: string,
): Promise<Record<string, unknown>> {
  const absolutePath = resolve(process.cwd(), repoRelativePath);
  return import(pathToFileURL(absolutePath).href);
}

function runtimeContext(): Record<string, unknown> {
  const approvedEnvVars = Object.fromEntries(
    APPROVED_ENV_VARS.map((name) => [
      name,
      process.env[name] ? 'set' : 'unset',
    ]),
  );

  const packageVersions = Object.fromEntries(
    ['redis', '@redis/client']
      .map((name) => [name, resolvePackageVersion(name)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  return {
    scenario: SCENARIO,
    run_label: RUN_LABEL,
    mode: MODE,
    cwd: process.cwd(),
    script_path: resolve(process.argv[1] ?? ''),
    node_executable: process.execPath,
    node_version: process.version,
    platform: process.platform,
    git_commit: gitValue('rev-parse', 'HEAD'),
    git_branch: gitValue('rev-parse', '--abbrev-ref', 'HEAD'),
    npm_execpath: process.env.npm_execpath ?? null,
    package_versions: packageVersions,
    approved_env_vars: approvedEnvVars,
    output_dir: outputDir(),
  };
}

function startCase(
  caseId: string,
  options: { mode?: ProbeMode; note?: string } = {},
): void {
  emit('case_start', {
    case_id: caseId,
    mode: options.mode ?? MODE,
    note: options.note ?? null,
  });
}

function recordCaseResult(
  caseId: string,
  observationSummary: string,
  resultFlag: ResultFlag,
  options: {
    mode?: ProbeMode;
    isWarmup?: boolean;
    totalLatencyS?: number;
    firstTokenLatencyS?: number;
    metrics?: Record<string, unknown>;
    error?: string | null;
  } = {},
): void {
  const payload: CaseResult = {
    case_id: caseId,
    mode: options.mode ?? MODE,
    is_warmup: options.isWarmup ?? false,
    observation_summary: observationSummary,
    result_flag: resultFlag,
    metrics: options.metrics ?? {},
    error: options.error ?? null,
  };

  if (options.totalLatencyS !== undefined) {
    payload.total_latency_s = options.totalLatencyS;
  }
  if (options.firstTokenLatencyS !== undefined) {
    payload.first_token_latency_s = options.firstTokenLatencyS;
  }

  RESULTS.push(payload);
  emit('case_result', payload as Record<string, unknown>);
}

function summarizeResults(): Record<string, unknown> {
  const cases = new Map<string, CaseResult[]>();
  for (const result of RESULTS) {
    const existing = cases.get(result.case_id) ?? [];
    existing.push(result);
    cases.set(result.case_id, existing);
  }

  const summarizedCases = Object.fromEntries(
    [...cases.entries()].map(([caseId, items]) => {
      const measured = items.filter((item) => !item.is_warmup);
      const effectiveItems = measured.length > 0 ? measured : items;
      const totalLatencies = effectiveItems
        .map((item) => item.total_latency_s)
        .filter((value): value is number => typeof value === 'number');
      const firstTokenLatencies = effectiveItems
        .map((item) => item.first_token_latency_s)
        .filter((value): value is number => typeof value === 'number');
      const resultFlags = Object.fromEntries(
        [...new Set(effectiveItems.map((item) => item.result_flag))].map(
          (flag) => [
            flag,
            effectiveItems.filter((item) => item.result_flag === flag).length,
          ],
        ),
      );
      const median = (values: number[]): number | null => {
        if (values.length === 0) {
          return null;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 1) {
          return sorted[middle];
        }
        return (sorted[middle - 1] + sorted[middle]) / 2;
      };

      return [
        caseId,
        {
          mode: items.at(-1)?.mode ?? MODE,
          runs: effectiveItems.length,
          warmups: items.length - effectiveItems.length,
          result_flags: resultFlags,
          median_total_latency_s: median(totalLatencies),
          median_first_token_latency_s: median(firstTokenLatencies),
          observations: effectiveItems
            .slice(0, 3)
            .map((item) => item.observation_summary),
        },
      ];
    }),
  );

  const overallResultFlags = Object.fromEntries(
    [...new Set(RESULTS.map((item) => item.result_flag))].map((flag) => [
      flag,
      RESULTS.filter((item) => item.result_flag === flag).length,
    ]),
  );

  return {
    scenario: SCENARIO,
    run_label: RUN_LABEL,
    mode: MODE,
    result_count: RESULTS.length,
    cases: summarizedCases,
    result_flags: overallResultFlags,
  };
}

function finalize(exitCode: number): void {
  const metadataPayload = {
    exit_code: exitCode,
    runtime_context: runtimeContext(),
  };
  const summaryPayload = summarizeResults();
  emit('summary', {
    metadata: metadataPayload,
    summary: summaryPayload,
  });

  const directory = outputDir();
  if (!directory) {
    return;
  }

  mkdirSync(directory, { recursive: true });
  const metadataPath = join(directory, 'metadata.json');
  const resultsPath = join(directory, 'results.json');
  const summaryPath = join(directory, 'summary.json');
  writeJson(metadataPath, metadataPayload);
  writeJson(resultsPath, RESULTS);
  writeJson(summaryPath, summaryPayload);
  emit('artifact_paths', {
    metadata_path: metadataPath,
    results_path: resultsPath,
    summary_path: summaryPath,
  });
}

async function main(): Promise<number> {
  const caseId = process.env.PROBE_CASE_ID ?? 'case-0001';
  emit('banner', { context: runtimeContext() });
  startCase(caseId);

  // Replace this block with the narrow runtime question you want to test.
  // Example:
  // const client = await importRepoModule('packages/client/lib/index.ts');
  // const hasCreateClient =
  //   typeof (client as { createClient?: unknown }).createClient === 'function';
  // recordCaseResult(
  //   caseId,
  //   hasCreateClient
  //     ? 'Loaded @redis/client source from the repository root.'
  //     : '@redis/client source loaded but expected exports were missing.',
  //   hasCreateClient ? 'expected' : 'negative',
  //   { metrics: { import_path: 'packages/client/lib/index.ts' } },
  // );
  recordCaseResult(
    caseId,
    'Template executed. Replace the placeholder block with the runtime behavior you want to observe.',
    'expected',
  );

  finalize(0);
  return 0;
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  emit('fatal', { error: message });
  finalize(1);
  process.exitCode = 1;
});
