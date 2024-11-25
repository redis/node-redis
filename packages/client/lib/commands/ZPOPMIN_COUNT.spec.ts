import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZPOPMIN_COUNT from './ZPOPMIN_COUNT';
import { parseArgs } from './generic-transformers';

describe('ZPOPMIN COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZPOPMIN_COUNT, 'key', 1),
      ['ZPOPMIN', 'key', '1']
    );
  });

  testUtils.testAll('zPopMinCount', async client => {
    const members = [{
      value: '1',
      score: 1
    }, {
      value: '2',
      score: 2
    }];

    const [ , reply] = await Promise.all([
      client.zAdd('key', members),
      client.zPopMinCount('key', members.length)
    ]);

    assert.deepEqual(reply, members);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
