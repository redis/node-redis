import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZPOPMIN from './ZPOPMIN';
import { parseArgs } from './generic-transformers';

describe('ZPOPMIN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZPOPMIN, 'key'),
      ['ZPOPMIN', 'key']
    );
  });

  testUtils.testAll('zPopMin - null', async client => {
    assert.equal(
      await client.zPopMin('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });

  testUtils.testAll('zPopMax - with member', async client => {
    const member = {
      value: 'value',
      score: 1
    };

    const [, reply] = await Promise.all([
      client.zAdd('key', member),
      client.zPopMin('key')
    ]);

    assert.deepEqual(reply, member);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
