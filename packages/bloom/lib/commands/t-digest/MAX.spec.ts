import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MAX from './MAX';

describe('TDIGEST.MAX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MAX.transformArguments('key'),
      ['TDIGEST.MAX', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.max', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.max('key')
    ]);

    assert.deepEqual(reply, NaN);
  }, GLOBAL.SERVERS.OPEN);
});
