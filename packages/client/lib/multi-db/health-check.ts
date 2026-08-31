import type { RedisArgument, ReplyUnion } from '../RESP/types';
import { setTimeout as delay } from 'node:timers/promises';
import type { ProbePolicy } from './config';

/**
 * Narrow handle a health check probes through — pins the probe to one
 * specific member and keeps the raw member client internal.
 */
export interface HealthCheckTarget {
  id: string;
  sendCommand(args: Array<RedisArgument>): Promise<ReplyUnion>;
}

/**
 * One probe against one member: resolve `true` if the member is healthy,
 * `false` if not. A rejected promise counts as a failed probe. Scheduling,
 * probe counts and the ALL/MAJORITY/ANY aggregation policy are owned by the
 * probe runner, not the check itself.
 */
export interface HealthCheck {
  probe(target: HealthCheckTarget): Promise<boolean>;
}

/**
 * Built-in health check: a probe passes when the member answers PING.
 * @experimental
 */
export class DefaultHealthCheck implements HealthCheck {
  async probe(target: HealthCheckTarget): Promise<boolean> {
    const reply = await target.sendCommand(['PING']);
    // toString covers both string and Buffer type mappings
    return reply?.toString() === 'PONG';
  }
}

export interface ProbeRoundOptions {
  /** probes per round */
  numProbes: number;
  /** ms between consecutive probes */
  delayBetweenProbes: number;
  /** round aggregation, evaluated with early exit */
  policy: ProbePolicy;
  /** ms allowed for one probe (the whole check chain); an overrun counts as a failed probe */
  timeout: number;
}

/**
 * Maximum wall-clock duration of one probe round — the readiness bound the
 * manager applies to member connection attempts.
 */
export function probeRoundBudget(options: ProbeRoundOptions): number {
  return options.numProbes * options.timeout
    + (options.numProbes - 1) * options.delayBetweenProbes;
}

/** Reject `promise` if it does not settle within `ms`; the timer never outlives the race. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function runCheckChain(
  target: HealthCheckTarget,
  checks: ReadonlyArray<HealthCheck>
): Promise<boolean> {
  for (const check of checks) {
    if (!await check.probe(target)) return false;
  }
  return true;
}

/**
 * One probe = every check in the chain passes, evaluated in order with early
 * exit; `timeout` bounds the whole chain and a rejection or overrun fails the
 * probe.
 */
async function runSingleProbe(
  target: HealthCheckTarget,
  checks: ReadonlyArray<HealthCheck>,
  timeout: number
): Promise<boolean> {
  try {
    return await withTimeout(runCheckChain(target, checks), timeout);
  } catch {
    return false;
  }
}

/**
 * Run one health-check round against a member: `numProbes` probes,
 * `delayBetweenProbes` apart, aggregated per `policy` with early exit as soon
 * as the outcome is decided.
 */
export async function runProbeRound(
  target: HealthCheckTarget,
  checks: ReadonlyArray<HealthCheck>,
  options: ProbeRoundOptions
): Promise<boolean> {
  const { numProbes, delayBetweenProbes, policy } = options;
  const majority = Math.floor(numProbes / 2) + 1;
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < numProbes; i++) {
    if (i > 0 && delayBetweenProbes > 0) {
      await delay(delayBetweenProbes);
    }

    if (await runSingleProbe(target, checks, options.timeout)) passed++;
    else failed++;

    switch (policy) {
      case 'ALL':
        if (failed > 0) return false;
        break;
      case 'ANY':
        if (passed > 0) return true;
        break;
      case 'MAJORITY':
        if (passed >= majority) return true;
        if (failed > numProbes - majority) return false;
        break;
    }
  }

  return policy === 'ALL';
}
