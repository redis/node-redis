import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import ADD from './ADD';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { RESP_TYPES } from '@redis/client/lib/RESP/decoder';

describe('BF.ADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ADD, 'key', 'item'),
      ['BF.ADD', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.bf.add', async client => {
    assert.equal(
      await client.bf.add('key', 'item'),
      true
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.bf.add with NUMBER String mapping (RESP2)', async client => {
    assert.equal(
      await client.withTypeMapping({
        [RESP_TYPES.NUMBER]: String
      }).bf.add('key', 'item'),
      true
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      RESP: 2
    }
  });
});
