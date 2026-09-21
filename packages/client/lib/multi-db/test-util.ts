import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DEFAULT_DOCKER_CONFIG } from '@redis/test-utils';
import type { RedisServerDocker } from '@redis/test-utils';
import testUtils from '../test-utils';
import type { MultiDbClientEvents } from './events';

const execFileAsync = promisify(execFile);

/**
 * The multi-db suites' docker image, sourced from the harness default — one
 * place to bump, in `@redis/test-utils`.
 */
export const DOCKER_IMAGE = {
  image: DEFAULT_DOCKER_CONFIG.dockerImageName as string,
  version: typeof DEFAULT_DOCKER_CONFIG.defaultDockerVersion === 'string'
    ? DEFAULT_DOCKER_CONFIG.defaultDockerVersion
    : DEFAULT_DOCKER_CONFIG.defaultDockerVersion!.tag,
  mode: 'server' as const
};

export function killServer(server: RedisServerDocker) {
  return execFileAsync('docker', ['kill', server.dockerId]);
}

export function startServer(server: RedisServerDocker) {
  return execFileAsync('docker', ['start', server.dockerId]).catch(() => {
    // best-effort revival between tests: the container may already run
  });
}

/**
 * Spawn the two shared member servers. Fulfilled spawns are always returned —
 * assign them before throwing `error`, so the suite's after() hook can clean
 * up the survivor of a partially failed spawn.
 */
export async function spawnServerPair(): Promise<{
  serverA?: RedisServerDocker;
  serverB?: RedisServerDocker;
  error?: unknown;
}> {
  const [resultA, resultB] = await Promise.allSettled([
    testUtils.spawnRedisServer({ serverArguments: [] }),
    testUtils.spawnRedisServer({ serverArguments: [] })
  ]);
  return {
    serverA: resultA.status === 'fulfilled' ? resultA.value : undefined,
    serverB: resultB.status === 'fulfilled' ? resultB.value : undefined,
    error: resultA.status === 'rejected'
      ? resultA.reason
      : resultB.status === 'rejected' ? resultB.reason : undefined
  };
}

type PayloadOf<E extends keyof MultiDbClientEvents> =
  MultiDbClientEvents[E] extends [infer P] ? P : void;

/**
 * Resolve with the next `event` payload from the wrapper client (typed against
 * the multi-db event map), reject after `timeoutMs`.
 */
export function once<E extends keyof MultiDbClientEvents>(
  emitter: unknown,
  event: E,
  timeoutMs = 20_000
): Promise<PayloadOf<E>> {
  return new Promise<PayloadOf<E>>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for '${event}' after ${timeoutMs}ms`)),
      timeoutMs
    );
    (emitter as { once(event: string, listener: (payload: PayloadOf<E>) => void): void }).once(event, payload => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** Issue `run` every `intervalMs`, collecting outcomes without ever throwing. */
export function startTraffic(run: () => Promise<unknown>, intervalMs = 50) {
  const errors: Array<Error> = [];
  let successes = 0;
  const timer = setInterval(() => {
    try {
      run().then(
        () => successes++,
        (err: Error) => errors.push(err)
      );
    } catch (err) {
      errors.push(err as Error);
    }
  }, intervalMs);
  return { errors, successes: () => successes, stop: () => clearInterval(timer) };
}
