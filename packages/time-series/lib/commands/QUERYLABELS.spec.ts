import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import QUERYLABELS from './QUERYLABELS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.QUERYLABELS LABELS', () => {
  describe('transformArguments', () => {
    it('without filter', () => {
      assert.deepEqual(
        parseArgs(QUERYLABELS),
        ['TS.QUERYLABELS', 'LABELS']
      );
    });

    it('single filter', () => {
      assert.deepEqual(
        parseArgs(QUERYLABELS, 'type=sensor'),
        ['TS.QUERYLABELS', 'LABELS', 'FILTER', 'type=sensor']
      );
    });

    it('multiple filters', () => {
      assert.deepEqual(
        parseArgs(QUERYLABELS, ['type=sensor', 'location=Kitchen']),
        ['TS.QUERYLABELS', 'LABELS', 'FILTER', 'type=sensor', 'location=Kitchen']
      );
    });

    it('throws on an explicitly empty filter list', () => {
      assert.throws(() => parseArgs(QUERYLABELS, []));
    });
  });

  testUtils.testWithClient('client.ts.queryLabels (with filter)', async client => {
    await Promise.all([
      client.ts.create('ts1', { LABELS: { type: 'sensor', location: 'LivingRoom', sensortype: 'temp' } }),
      client.ts.create('ts2', { LABELS: { type: 'sensor', location: 'Kitchen', sensortype: 'temp' } }),
      client.ts.create('ts3', { LABELS: { type: 'gauge', location: 'BedRoom' } })
    ]);

    const reply = await client.ts.queryLabels(['type=sensor']);
    assert.deepEqual(
      [...reply].sort(),
      ['location', 'sensortype', 'type']
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.queryLabels (no filter)', async client => {
    await client.ts.create('ts1', { LABELS: { type: 'sensor', location: 'LivingRoom' } });

    const reply = await client.ts.queryLabels();
    assert.deepEqual(
      [...reply].sort(),
      ['location', 'type']
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.queryLabels (empty result is not an error)', async client => {
    await client.ts.create('ts1', { LABELS: { type: 'sensor' } });

    const reply = await client.ts.queryLabels(['type=nonexistent']);
    assert.deepEqual([...reply], []);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.queryLabels (RESP2 flat array)', async client => {
    await client.ts.create('ts1', { LABELS: { type: 'sensor', location: 'LivingRoom' } });

    const reply = await client.ts.queryLabels(['type=sensor']);
    assert.deepEqual(
      [...reply].sort(),
      ['location', 'type']
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      RESP: 2
    },
    minimumDockerVersion: [8, 10]
  });
});
