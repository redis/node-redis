import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_LIST from './COMMAND_LIST';
import { parseArgs } from './generic-transformers';

describe('COMMAND LIST', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(COMMAND_LIST),
        ['COMMAND', 'LIST']
      );
    });

    describe('with FILTERBY', () => {
      it('MODULE', () => {
        assert.deepEqual(
          parseArgs(COMMAND_LIST, {
            FILTERBY: {
              type: 'MODULE',
              value: 'JSON'
            }
          }),
          ['COMMAND', 'LIST', 'FILTERBY', 'MODULE', 'JSON']
        );
      });

      it('ACLCAT', () => {
        assert.deepEqual(
          parseArgs(COMMAND_LIST, {
            FILTERBY: {
              type: 'ACLCAT',
              value: 'admin'
            }
          }),
          ['COMMAND', 'LIST', 'FILTERBY', 'ACLCAT', 'admin']
        );
      });

      it('PATTERN', () => {
        assert.deepEqual(
          parseArgs(COMMAND_LIST, {
            FILTERBY: {
              type: 'PATTERN',
              value: 'a*'
            }
          }),
          ['COMMAND', 'LIST', 'FILTERBY', 'PATTERN', 'a*']
        );
      });
    });
  });

  testUtils.testWithClient('client.commandList', async client => {
    const commandList = await client.commandList();
    assert.ok(Array.isArray(commandList));
    for (const command of commandList) {
      assert.ok(typeof command === 'string');
    }
  }, GLOBAL.SERVERS.OPEN);
});
