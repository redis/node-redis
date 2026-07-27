import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HIMPORT_DISCARD from './HIMPORT_DISCARD';
import { parseArgs } from './generic-transformers';

describe('HIMPORT DISCARD', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_DISCARD, 'fieldset'),
        ['HIMPORT', 'DISCARD', 'fieldset']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 10]);

    testUtils.testAll('hImportDiscard', async client => {
      await client.hImportPrepare('fieldset', ['f1', 'f2']);

      assert.equal(
        await client.hImportDiscard('fieldset'),
        1
      );

      assert.equal(
        await client.hImportDiscard('fieldset'),
        0
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
