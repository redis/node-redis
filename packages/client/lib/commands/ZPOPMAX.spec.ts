import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZPOPMAX from './ZPOPMAX';
import { parseArgs } from './generic-transformers';

describe('ZPOPMAX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZPOPMAX, 'key'),
      ['ZPOPMAX', 'key']
    );
  });

  testUtils.testAll('zPopMax - null', async client => {
    assert.equal(
      await client.zPopMax('key'),
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
      client.zPopMax('key')
    ]);

    assert.deepEqual(reply, member);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
