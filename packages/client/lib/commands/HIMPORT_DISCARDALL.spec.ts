import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HIMPORT_DISCARDALL from './HIMPORT_DISCARDALL';
import { parseArgs } from './generic-transformers';

describe('HIMPORT DISCARDALL', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(HIMPORT_DISCARDALL),
        ['HIMPORT', 'DISCARDALL']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 10]);

    testUtils.testAll('hImportDiscardAll', async client => {
      assert.equal(
        await client.hImportDiscardAll(),
        0
      );

      await client.hImportPrepare('fieldset', ['f1', 'f2']);

      assert.equal(
        await client.hImportDiscardAll(),
        1
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
