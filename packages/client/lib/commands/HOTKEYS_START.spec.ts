import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HOTKEYS_START from './HOTKEYS_START';
import { parseArgs } from './generic-transformers';

describe('HOTKEYS START', () => {

  describe('transformArguments', () => {
    it('with CPU metric only', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 1, CPU: true }
        }),
        ['HOTKEYS', 'START', 'METRICS', '1', 'CPU']
      );
    });

    it('with NET metric only', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 1, NET: true }
        }),
        ['HOTKEYS', 'START', 'METRICS', '1', 'NET']
      );
    });

    it('with both CPU and NET metrics', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 2, CPU: true, NET: true }
        }),
        ['HOTKEYS', 'START', 'METRICS', '2', 'CPU', 'NET']
      );
    });

    it('with COUNT option', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 1, CPU: true },
          COUNT: 20
        }),
        ['HOTKEYS', 'START', 'METRICS', '1', 'CPU', 'COUNT', '20']
      );
    });

    it('with DURATION option', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 1, CPU: true },
          DURATION: 60
        }),
        ['HOTKEYS', 'START', 'METRICS', '1', 'CPU', 'DURATION', '60']
      );
    });

    it('with SAMPLE option', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 1, CPU: true },
          SAMPLE: 10
        }),
        ['HOTKEYS', 'START', 'METRICS', '1', 'CPU', 'SAMPLE', '10']
      );
    });

    it('with SLOTS option', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 1, CPU: true },
          SLOTS: { count: 3, slots: [0, 5, 6] }
        }),
        ['HOTKEYS', 'START', 'METRICS', '1', 'CPU', 'SLOTS', '3', '0', '5', '6']
      );
    });

    it('with all options', () => {
      assert.deepEqual(
        parseArgs(HOTKEYS_START, {
          METRICS: { count: 2, CPU: true, NET: true },
          COUNT: 15,
          DURATION: 120,
          SAMPLE: 5,
          SLOTS: { count: 2, slots: [100, 200] }
        }),
        [
          'HOTKEYS', 'START',
          'METRICS', '2', 'CPU', 'NET',
          'COUNT', '15',
          'DURATION', '120',
          'SAMPLE', '5',
          'SLOTS', '2', '100', '200'
        ]
      );
    });
  });

  testUtils.testWithClient('client.hotkeysStart', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking with CPU metric
    assert.equal(
      await client.hotkeysStart({
        METRICS: { count: 1, CPU: true }
      }),
      'OK'
    );

    // Stop tracking to clean up
    await client.hotkeysStop();
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.hotkeysStart with all options', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking with all options (DURATION must be >= 1)
    assert.equal(
      await client.hotkeysStart({
        METRICS: { count: 2, CPU: true, NET: true },
        COUNT: 20,
        DURATION: 60,
        SAMPLE: 1
      }),
      'OK'
    );

    // Stop tracking to clean up
    await client.hotkeysStop();
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});
