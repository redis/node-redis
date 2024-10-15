import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import STRLEN from './STRLEN';

describe('STRLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      STRLEN.transformArguments('key'),
      ['STRLEN', 'key']
    );
  });

  testUtils.testAll('strLen', async client => {
    assert.equal(
      await client.strLen('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
