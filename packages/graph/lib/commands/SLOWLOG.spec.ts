import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SLOWLOG from './SLOWLOG';

describe('GRAPH.SLOWLOG', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SLOWLOG.transformArguments('key'),
      ['GRAPH.SLOWLOG', 'key']
    );
  });

  testUtils.testWithClient('client.graph.slowLog', async client => {
    const [, reply] = await Promise.all([
      client.graph.query('key', 'RETURN 1'),
      client.graph.slowLog('key')
    ]);
    assert.equal(reply.length, 1);
  }, GLOBAL.SERVERS.OPEN);
});
