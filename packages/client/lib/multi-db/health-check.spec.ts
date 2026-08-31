import { strict as assert } from 'node:assert';
import {
  DefaultHealthCheck,
  runProbeRound,
  probeRoundBudget,
  HealthCheck,
  HealthCheckTarget
} from './health-check';
import type { ReplyUnion } from '../RESP/types';

const TARGET: HealthCheckTarget = {
  id: 'stub',
  sendCommand: () => Promise.resolve('PONG' as ReplyUnion)
};

/** health check driven by a scripted list of outcomes: true/false per probe, 'reject' rejects, 'hang' never settles */
function scriptedCheck(outcomes: Array<boolean | 'reject' | 'hang'>) {
  let calls = 0;
  const check: HealthCheck = {
    probe() {
      const outcome = outcomes[calls++];
      switch (outcome) {
        case 'reject': return Promise.reject(new Error('probe error'));
        case 'hang': return new Promise<boolean>(() => {});
        default: return Promise.resolve(outcome);
      }
    }
  };
  return { check, attempts: () => calls };
}

const OPTIONS = {
  numProbes: 3,
  delayBetweenProbes: 0,
  timeout: 25,
  policy: 'ALL'
} as const;

describe('DefaultHealthCheck', () => {
  it('passes when the member answers PONG', async () => {
    assert.equal(await new DefaultHealthCheck().probe(TARGET), true);
  });

  it('fails on any other reply', async () => {
    const check = new DefaultHealthCheck();
    assert.equal(
      await check.probe({ id: 'stub', sendCommand: () => Promise.resolve('LOADING' as ReplyUnion) }),
      false
    );
  });

  it('propagates rejections to the runner', async () => {
    const target: HealthCheckTarget = {
      id: 'stub',
      sendCommand: () => Promise.reject(new Error('down'))
    };
    await assert.rejects(new DefaultHealthCheck().probe(target));
  });
});

describe('runProbeRound', () => {
  describe('ALL', () => {
    it('passes when every probe passes', async () => {
      const { check, attempts } = scriptedCheck([true, true, true]);
      assert.equal(await runProbeRound(TARGET, [check], OPTIONS), true);
      assert.equal(attempts(), 3);
    });

    it('exits early on the first failed probe', async () => {
      const { check, attempts } = scriptedCheck([false, true, true]);
      assert.equal(await runProbeRound(TARGET, [check], OPTIONS), false);
      assert.equal(attempts(), 1);
    });
  });

  describe('ANY', () => {
    it('exits early on the first passing probe', async () => {
      const { check, attempts } = scriptedCheck([true]);
      assert.equal(await runProbeRound(TARGET, [check], { ...OPTIONS, policy: 'ANY' }), true);
      assert.equal(attempts(), 1);
    });

    it('fails when every probe fails', async () => {
      const { check, attempts } = scriptedCheck([false, false, false]);
      assert.equal(await runProbeRound(TARGET, [check], { ...OPTIONS, policy: 'ANY' }), false);
      assert.equal(attempts(), 3);
    });
  });

  describe('MAJORITY', () => {
    it('passes on pass/fail/pass', async () => {
      const { check } = scriptedCheck([true, false, true]);
      assert.equal(await runProbeRound(TARGET, [check], { ...OPTIONS, policy: 'MAJORITY' }), true);
    });

    it('exits early once the majority is reached', async () => {
      const { check, attempts } = scriptedCheck([true, true, true]);
      assert.equal(await runProbeRound(TARGET, [check], { ...OPTIONS, policy: 'MAJORITY' }), true);
      assert.equal(attempts(), 2);
    });

    it('exits early once the majority is impossible', async () => {
      const { check, attempts } = scriptedCheck([false, false, true]);
      assert.equal(await runProbeRound(TARGET, [check], { ...OPTIONS, policy: 'MAJORITY' }), false);
      assert.equal(attempts(), 2);
    });
  });

  describe('probe outcomes', () => {
    it('a rejected probe counts as a failure', async () => {
      const { check } = scriptedCheck(['reject']);
      assert.equal(await runProbeRound(TARGET, [check], OPTIONS), false);
    });

    it('a probe that overruns the timeout counts as a failure', async () => {
      const { check } = scriptedCheck(['hang']);
      assert.equal(await runProbeRound(TARGET, [check], OPTIONS), false);
    });
  });

  describe('check chain', () => {
    it('passes only when every check in the chain passes', async () => {
      const first = scriptedCheck([true, true, true]);
      const second = scriptedCheck([true, true, true]);
      assert.equal(await runProbeRound(TARGET, [first.check, second.check], OPTIONS), true);
    });

    it('a failing check fails the probe and skips the rest of the chain', async () => {
      const first = scriptedCheck([false]);
      const second = scriptedCheck([]);
      assert.equal(await runProbeRound(TARGET, [first.check, second.check], OPTIONS), false);
      assert.equal(second.attempts(), 0);
    });
  });
});

describe('probeRoundBudget', () => {
  it('is probes x timeout plus the gaps between them', () => {
    assert.equal(
      probeRoundBudget({ numProbes: 3, timeout: 200, delayBetweenProbes: 50, policy: 'ALL' }),
      3 * 200 + 2 * 50
    );
  });
});
