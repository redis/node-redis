import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VCARD from './VCARD';
import { parseArgs } from './generic-transformers';

describe('VCARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VCARD, 'key'),
      ['VCARD', 'key']
    );
  });

  testUtils.testAll('vCard', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');

    assert.equal(
      await client.vCard('key'),
      2
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
