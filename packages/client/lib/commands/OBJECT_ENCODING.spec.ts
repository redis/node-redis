import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJECT_ENCODING from './OBJECT_ENCODING';

describe('OBJECT ENCODING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      OBJECT_ENCODING.transformArguments('key'),
      ['OBJECT', 'ENCODING', 'key']
    );
  });

  testUtils.testAll('objectEncoding', async client => {
    assert.equal(
      await client.objectEncoding('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
