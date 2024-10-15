import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRPOP from './ARRPOP';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.ARRPOP', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ARRPOP, 'key'),
        ['JSON.ARRPOP', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(ARRPOP, 'key', {
          path: '$'
        }),
        ['JSON.ARRPOP', 'key', '$']
      );
    });

    it('with path and index', () => {
      assert.deepEqual(
        parseArgs(ARRPOP, 'key', {
          path: '$',
          index: 0
        }),
        ['JSON.ARRPOP', 'key', '$', '0']
      );
    });
  });

  describe('client.json.arrPop', () => {
    testUtils.testWithClient('without path and value', async client => {
      const [, reply] = await Promise.all([
        client.json.set('key', '$', []),
        client.json.arrPop('key')
      ]);

      assert.equal(reply, null);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('. path with value', async client => {
      const [, reply] = await Promise.all([
        client.json.set('key', '.', ['value']),
        client.json.arrPop('key', {
          path: '.'
        })
      ]);

      assert.equal(reply, 'value');
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('$ path with value', async client => {
      const [, reply] = await Promise.all([
        client.json.set('key', '$', ['value']),
        client.json.arrPop('key', {
          path: '$'
        })
      ]);

      assert.deepEqual(reply, ['value']);
    }, GLOBAL.SERVERS.OPEN);
  });
});
