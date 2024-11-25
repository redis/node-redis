import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRTRIM from './ARRTRIM';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.ARRTRIM', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ARRTRIM, 'key', '$', 0, 1),
      ['JSON.ARRTRIM', 'key', '$', '0', '1']
    );
  });

  testUtils.testWithClient('client.json.arrTrim', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrTrim('key', '$', 0, 1)
    ]);

    assert.deepEqual(reply, [0]);
  }, GLOBAL.SERVERS.OPEN);
});
