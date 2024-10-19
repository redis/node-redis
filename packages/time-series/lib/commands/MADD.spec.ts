import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MADD from './MADD';
import { SimpleError } from '@redis/client/lib/errors';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MADD, [{
        key: '1',
        timestamp: 0,
        value: 0
      }, {
        key: '2',
        timestamp: 1,
        value: 1
      }]),
      ['TS.MADD', '1', '0', '0', '2', '1', '1']
    );
  });

  testUtils.testWithClient('client.ts.mAdd', async client => {
    const [, reply] = await Promise.all([
      client.ts.create('key'),
      client.ts.mAdd([{
        key: 'key',
        timestamp: 0,
        value: 1
      }, {
        key: 'key',
        timestamp: 0,
        value: 1
      }])
    ]);

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 2);
    assert.equal(reply[0], 0);
    assert.ok(reply[1] instanceof SimpleError);
  }, GLOBAL.SERVERS.OPEN);
});
