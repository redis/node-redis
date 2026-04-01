import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DUMP from './DUMP';
import { parseArgs } from './generic-transformers';

describe('DUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DUMP, 'key'),
      ['DUMP', 'key']
    );
  });

  testUtils.testAll('client.dump', async client => {
    assert.equal(
      await client.dump('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('client.dump with data', async client => {
    await client.set('dumpKey', 'value');
    const reply = await client.dump('dumpKey');
    assert.ok(reply !== null);
    assert.ok(Buffer.isBuffer(reply) || typeof reply === 'string');
    assert.ok(reply.length > 0);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
