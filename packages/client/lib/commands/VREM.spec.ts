import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VREM from './VREM';
import { parseArgs } from './generic-transformers';

describe('VREM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(VREM, 'key', 'element'),
      ['VREM', 'key', 'element']
    );
  });

  testUtils.testAll('vRem', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    assert.equal(
      await client.vRem('key', 'element'),
      1
    );

    assert.equal(
      await client.vCard('key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
