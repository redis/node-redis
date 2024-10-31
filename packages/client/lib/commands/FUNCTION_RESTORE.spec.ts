import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_RESTORE from './FUNCTION_RESTORE';
import { RESP_TYPES } from '../RESP/decoder';
import { parseArgs } from './generic-transformers';

describe('FUNCTION RESTORE', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_RESTORE, 'dump'),
        ['FUNCTION', 'RESTORE', 'dump']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(FUNCTION_RESTORE, 'dump', {
          mode: 'APPEND'
        }),
        ['FUNCTION', 'RESTORE', 'dump', 'APPEND']
      );
    });
  });

  testUtils.testWithClient('client.functionRestore', async client => {
    assert.equal(
      await client.functionRestore(
        await client.withTypeMapping({
          [RESP_TYPES.BLOB_STRING]: Buffer
        }).functionDump(),
        {
          mode: 'REPLACE'
        }
      ),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
