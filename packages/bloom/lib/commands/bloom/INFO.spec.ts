import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'bloom'),
      ['BF.INFO', 'bloom']
    );
  });

  testUtils.testWithClient('client.bf.info', async client => {
    const [, reply] = await Promise.all([
      client.bf.reserve('key', 0.01, 100),
      client.bf.info('key')
    ]);

    assert.equal(typeof reply, 'object');
    assert.equal(reply['Capacity'], 100);
    assert.equal(typeof reply['Size'], 'number');
    assert.equal(typeof reply['Number of filters'], 'number');
    assert.equal(typeof reply['Number of items inserted'], 'number');
    assert.equal(typeof reply['Expansion rate'], 'number');
  }, GLOBAL.SERVERS.OPEN);
});
