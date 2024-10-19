import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GET from './GET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.GET', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(GET, 'key'),
        ['TS.GET', 'key']
      );
    });

    it('with LATEST', () => {
      assert.deepEqual(
        parseArgs(GET, 'key', {
          LATEST: true
        }),
        ['TS.GET', 'key', 'LATEST']
      );
    });
  });

  describe('client.ts.get', () => {
    testUtils.testWithClient('null', async client => {
      const [, reply] = await Promise.all([
        client.ts.create('key'),
        client.ts.get('key')
      ]);

      assert.equal(reply, null);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with sample', async client => {
      const [, reply] = await Promise.all([
        client.ts.add('key', 0, 1),
        client.ts.get('key')
      ]);

      assert.deepEqual(reply, {
        timestamp: 0,
        value: 1
      });
    }, GLOBAL.SERVERS.OPEN);
  });
});
