import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import CDF from './CDF';

describe('TDIGEST.CDF', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CDF.transformArguments('key', [1, 2]),
      ['TDIGEST.CDF', 'key', '1', '2']
    );
  });

  testUtils.testWithClient('client.tDigest.cdf', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('key'),
      client.tDigest.cdf('key', [1])
    ]);

    assert.deepEqual(reply, [NaN]);
  }, GLOBAL.SERVERS.OPEN);
});
