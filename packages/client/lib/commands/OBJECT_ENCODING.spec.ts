import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJECT_ENCODING from './OBJECT_ENCODING';
import { parseArgs } from './generic-transformers';

describe('OBJECT ENCODING', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(OBJECT_ENCODING, 'key'),
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
