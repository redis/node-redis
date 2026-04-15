import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SET from './SET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.SET', () => {
  describe('transformArguments', () => {
    it('transformArguments', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json'),
        ['JSON.SET', 'key', '$', '"json"']
      );
    });

    it('condition NX', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { condition: 'NX' }),
        ['JSON.SET', 'key', '$', '"json"', 'NX']
      );
    });

    it('condition XX', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { condition: 'XX' }),
        ['JSON.SET', 'key', '$', '"json"', 'XX']
      );
    });

    it('NX', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { NX: true }),
        ['JSON.SET', 'key', '$', '"json"', 'NX']
      );
    });

    it('XX', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { XX: true }),
        ['JSON.SET', 'key', '$', '"json"', 'XX']
      );
    });

    for (const fpha of ['BF16', 'FP16', 'FP32', 'FP64'] as const) {
      it(`FPHA ${fpha}`, () => {
        assert.deepEqual(
          parseArgs(SET, 'key', '$', 'json', { fpha }),
          ['JSON.SET', 'key', '$', '"json"', 'FPHA', fpha]
        );
      });
    }

    it('condition with FPHA', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { condition: 'NX', fpha: 'FP32' }),
        ['JSON.SET', 'key', '$', '"json"', 'NX', 'FPHA', 'FP32']
      );
    });
  });

  testUtils.testWithClient('client.json.set', async client => {
    assert.equal(
      await client.json.set('key', '$', 'json'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'client.json.set with FPHA', async client => {
    const fpArray = [1.1, 2.2, 3.3, 4.4];

    for (const fpha of ['FP32', 'FP64', 'FP16', 'BF16'] as const) {
      const key = `fpha:${fpha}`;
      assert.equal(
        await client.json.set(key, '$', fpArray, { fpha }),
        'OK'
      );

      const result = await client.json.get(key);
      assert.equal(Array.isArray(result), true);
      assert.equal((result as Array<unknown>).length, fpArray.length);
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'client.json.set with FPHA and conditions', async client => {
    const fpArray = [1.5, 2.5, 3.5];

    assert.equal(
      await client.json.set('fpha:nx', '$', fpArray, { condition: 'NX', fpha: 'FP32' }),
      'OK'
    );
    assert.equal(
      await client.json.set('fpha:nx', '$', [4.5, 5.5], { condition: 'NX', fpha: 'FP32' }),
      null
    );
    assert.equal(
      await client.json.set('fpha:nx', '$', [4.5, 5.5], { condition: 'XX', fpha: 'FP32' }),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
