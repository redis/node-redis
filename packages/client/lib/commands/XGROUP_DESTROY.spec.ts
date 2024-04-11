import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XGROUP_DESTROY from './XGROUP_DESTROY';

describe('XGROUP DESTROY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      XGROUP_DESTROY.transformArguments('key', 'group'),
      ['XGROUP', 'DESTROY', 'key', 'group']
    );
  });

  testUtils.testAll('xGroupDestroy', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xGroupDestroy('key', 'group')
    ]);

    assert.equal(reply, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
