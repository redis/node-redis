import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HIMPORT_PREPARE from './HIMPORT_PREPARE';
import { parseArgs } from './generic-transformers';

describe('HIMPORT PREPARE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_PREPARE, 'fieldset', 'field'),
        ['HIMPORT', 'PREPARE', 'fieldset', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_PREPARE, 'fieldset', ['f1', 'f2']),
        ['HIMPORT', 'PREPARE', 'fieldset', 'f1', 'f2']
      );
    });

    it('preserves caller field order', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_PREPARE, 'fieldset', ['c', 'a', 'b']),
        ['HIMPORT', 'PREPARE', 'fieldset', 'c', 'a', 'b']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 10]);

    testUtils.testAll('hImportPrepare', async client => {
      assert.equal(
        await client.hImportPrepare('fieldset', ['f1', 'f2']),
        'OK'
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });

    testUtils.testWithClient('rejects duplicate field names', async client => {
      await assert.rejects(
        client.hImportPrepare('fieldset', ['f1', 'f1']),
        /duplicate field name/
      );
    }, GLOBAL.SERVERS.OPEN);
  });
});
