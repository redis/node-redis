import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MIN from './MIN';

describe('TDIGEST.MIN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MIN.transformArguments('key'),
      ['TDIGEST.MIN', 'key']
    );
  });

  testUtils.testWithClient('client.tDigest.min', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.min('key')
    ]);

    assert.equal(reply, NaN);
  }, GLOBAL.SERVERS.OPEN);
});
