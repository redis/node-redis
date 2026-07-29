import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HIMPORT_SET from './HIMPORT_SET';
import { parseArgs } from './generic-transformers';

describe('HIMPORT SET', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_SET, 'key', 'fieldset', 'value'),
        ['HIMPORT', 'SET', 'key', 'fieldset', 'value']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_SET, 'key', 'fieldset', ['v1', 'v2']),
        ['HIMPORT', 'SET', 'key', 'fieldset', 'v1', 'v2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 10]);

    testUtils.testAll('hImportSet roundtrip', async client => {
      await client.hImportPrepare('fieldset', ['f1', 'f2']);

      assert.equal(
        await client.hImportSet('key', 'fieldset', ['v1', 'v2']),
        'OK'
      );

      // enumeration order is canonicalized server-side — assert content, not order
      assert.deepEqual(
        await client.hGetAll('key'),
        { f1: 'v1', f2: 'v2' }
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });

    testUtils.testWithClient('rejects on value count mismatch', async client => {
      await client.hImportPrepare('fieldset', ['f1', 'f2']);

      await assert.rejects(
        client.hImportSet('key', 'fieldset', ['v1']),
        /value count/
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('rejects with WRONGTYPE on non-hash key', async client => {
      await client.set('key', 'string');
      await client.hImportPrepare('fieldset', ['f1']);

      await assert.rejects(
        client.hImportSet('key', 'fieldset', ['v1']),
        /WRONGTYPE/
      );
    }, GLOBAL.SERVERS.OPEN);
  });
});
