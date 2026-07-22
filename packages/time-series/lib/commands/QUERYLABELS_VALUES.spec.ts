import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import QUERYLABELS_VALUES from './QUERYLABELS_VALUES';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.QUERYLABELS VALUES', () => {
  describe('transformArguments', () => {
    it('without filter', () => {
      assert.deepEqual(
        parseArgs(QUERYLABELS_VALUES, 'location'),
        ['TS.QUERYLABELS', 'VALUES', 'location']
      );
    });

    it('single filter', () => {
      assert.deepEqual(
        parseArgs(QUERYLABELS_VALUES, 'location', 'type=sensor'),
        ['TS.QUERYLABELS', 'VALUES', 'location', 'FILTER', 'type=sensor']
      );
    });

    it('multiple filters', () => {
      assert.deepEqual(
        parseArgs(QUERYLABELS_VALUES, 'location', ['type=sensor', 'sensortype=temp']),
        ['TS.QUERYLABELS', 'VALUES', 'location', 'FILTER', 'type=sensor', 'sensortype=temp']
      );
    });

    it('throws on an explicitly empty filter list', () => {
      assert.throws(() => parseArgs(QUERYLABELS_VALUES, 'location', []));
    });
  });

  testUtils.testWithClient('client.ts.queryLabelValues (with filter)', async client => {
    await Promise.all([
      client.ts.create('ts1', { LABELS: { type: 'sensor', location: 'LivingRoom' } }),
      client.ts.create('ts2', { LABELS: { type: 'sensor', location: 'Kitchen' } }),
      client.ts.create('ts3', { LABELS: { type: 'gauge', location: 'BedRoom' } })
    ]);

    const reply = await client.ts.queryLabelValues('location', ['type=sensor']);
    assert.deepEqual(
      [...reply].sort(),
      ['Kitchen', 'LivingRoom']
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.queryLabelValues (no filter)', async client => {
    await Promise.all([
      client.ts.create('ts1', { LABELS: { location: 'LivingRoom' } }),
      client.ts.create('ts2', { LABELS: { location: 'Kitchen' } })
    ]);

    const reply = await client.ts.queryLabelValues('location');
    assert.deepEqual(
      [...reply].sort(),
      ['Kitchen', 'LivingRoom']
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.queryLabelValues (unknown label is empty, not an error)', async client => {
    await client.ts.create('ts1', { LABELS: { type: 'sensor', location: 'LivingRoom' } });

    const reply = await client.ts.queryLabelValues('nope', ['type=sensor']);
    assert.deepEqual([...reply], []);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});
