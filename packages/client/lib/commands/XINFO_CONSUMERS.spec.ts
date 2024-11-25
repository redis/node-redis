import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XINFO_CONSUMERS from './XINFO_CONSUMERS';
import { parseArgs } from './generic-transformers';

describe('XINFO CONSUMERS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XINFO_CONSUMERS, 'key', 'group'),
      ['XINFO', 'CONSUMERS', 'key', 'group']
    );
  });

  testUtils.testAll('xInfoConsumers', async client => {
    const [, , reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      // using `XREADGROUP` and not `XGROUP CREATECONSUMER` because the latter was introduced in Redis 6.2
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '0-0'
      }),
      client.xInfoConsumers('key', 'group')
    ]);

    for (const consumer of reply) {
      assert.equal(typeof consumer.name, 'string');
      assert.equal(typeof consumer.pending, 'number');
      assert.equal(typeof consumer.idle, 'number');
      if (testUtils.isVersionGreaterThan([7, 2])) {
        assert.equal(typeof consumer.inactive, 'number');
      }
    }
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
