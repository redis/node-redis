import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';

describe('CMS.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      INFO.transformArguments('key'),
      ['CMS.INFO', 'key']
    );
  });

  testUtils.testWithClient('client.cms.info', async client => {
    const width = 1000,
      depth = 5,
      [, reply] = await Promise.all([
        client.cms.initByDim('key', width, depth),
        client.cms.info('key')
      ]);

    assert.deepEqual(reply, {
      width,
      depth,
      count: 0
    });
  }, GLOBAL.SERVERS.OPEN);
});
