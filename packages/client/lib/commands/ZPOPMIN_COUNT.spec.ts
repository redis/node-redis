import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZPOPMIN_COUNT from './ZPOPMIN_COUNT';

describe('ZPOPMIN COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ZPOPMIN_COUNT.transformArguments('key', 1),
      ['ZPOPMIN', 'key', '1']
    );
  });

  testUtils.testAll('zPopMinCount', async client => {
    const members = [{
      value: '1',
      score: 1
    }];

    const [ , reply] = await Promise.all([
      client.zAdd('key', members),
      client.zPopMinCount('key', 1)
    ]);

    assert.deepEqual(reply, members);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.SERVERS.OPEN
  });
});
