import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LATENCY_GRAPH';

describe('LATENCY GRAPH', () => {
  it('transformArguments', () => {
    assert.deepEqual(transformArguments('command'), [
      'LATENCY',
      'GRAPH',
      'command',
    ]);
  });

  testUtils.testWithClient(
    'client.latencyGraph',
    async (client) => {
      assert.equal(
        await client.configSet('latency-monitor-threshold', '1'),
        'OK'
      );

      assert.equal(await client.sendCommand(['DEBUG', 'sleep', '.1']), 'OK');

      assert.equal(typeof (await client.latencyGraph('command')), 'string');
    },
    GLOBAL.SERVERS.OPEN
  );
});
