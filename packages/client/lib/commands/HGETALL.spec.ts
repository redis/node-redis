import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('HGETALL', () => {

  testUtils.testAll('hGetAll empty', async client => {
    assert.deepEqual(
      await client.hGetAll('key'),
      {}
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('hGetAll with value', async client => {
    const [, reply] = await Promise.all([
      client.hSet('key', 'field', 'value'),
      client.hGetAll('key')
    ]);
    assert.deepEqual(
      reply,
      Object.defineProperties({}, {
        field: {
          value: 'value',
          enumerable: true
        }
      })
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
