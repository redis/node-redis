import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RANDOMKEY from './RANDOMKEY';
import { parseArgs } from './generic-transformers';

describe('RANDOMKEY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RANDOMKEY),
      ['RANDOMKEY']
    );
  });

  testUtils.testAll('randomKey', async client => {
    assert.equal(
      await client.randomKey(),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('randomKey with keys in database', async client => {
    await client.set('key1', 'value1');
    await client.set('key2', 'value2');

    const reply = await client.randomKey();
    assert.equal(typeof reply, 'string');
    assert.ok(['key1', 'key2'].includes(reply!));
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
