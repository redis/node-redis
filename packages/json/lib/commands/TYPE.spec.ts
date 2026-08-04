import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TYPE from './TYPE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.TYPE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(TYPE, 'key'),
        ['JSON.TYPE', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(TYPE, 'key', {
          path: '$'
        }),
        ['JSON.TYPE', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.type', async client => {
    assert.equal(
      await client.json.type('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.type with $-based path', async client => {
    await client.json.set('key', '$', {
      string: 'value',
      number: 42,
      array: [1, 2, 3],
      object: { nested: true }
    });

    const reply = await client.json.type('key', { path: '$' });
    assert.deepEqual(reply, ['object']);

    const stringType = await client.json.type('key', { path: '$.string' });
    assert.deepEqual(stringType, ['string']);

    const numberType = await client.json.type('key', { path: '$.number' });
    assert.deepEqual(numberType, ['integer']);

    const arrayType = await client.json.type('key', { path: '$.array' });
    assert.deepEqual(arrayType, ['array']);
  }, GLOBAL.SERVERS.OPEN);
});
