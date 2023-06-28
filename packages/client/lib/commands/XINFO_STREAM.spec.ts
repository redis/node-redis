import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import XINFO_STREAM from './XINFO_STREAM';

describe('XINFO STREAM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      XINFO_STREAM.transformArguments('key'),
      ['XINFO', 'STREAM', 'key']
    );
  });

  testUtils.testAll('xInfoStream', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xInfoStream('key')
    ]);

    assert.deepEqual(reply, {
      length: 0,
      radixTreeKeys: 0,
      radixTreeNodes: 1,
      groups: 1,
      lastGeneratedId: '0-0',
      firstEntry: null,
      lastEntry: null
    });
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
