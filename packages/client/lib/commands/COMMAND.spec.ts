import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs, transformCommandReply, CommandFlags, CommandCategories, CommandRawReply } from './generic-transformers';
import COMMAND from './COMMAND';

describe('COMMAND', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(COMMAND),
      ['COMMAND']
    );
  });

  describe('transformCommandReply', () => {
    const testCases = [
      {
        name: 'without policies',
        input: ['ping', -1, [CommandFlags.STALE], 0, 0, 0, [CommandCategories.FAST], [], []] satisfies CommandRawReply,
        expected: {
          name: 'ping',
          arity: -1,
          flags: new Set([CommandFlags.STALE]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([CommandCategories.FAST]),
          policies: { request: undefined, response: undefined },
		  isKeyless: true
        }
      },
      {
        name: 'with valid policies',
        input: ['dbsize', 1, [], 0, 0, 0, [], ['request_policy:all_shards', 'response_policy:agg_sum'], []] satisfies CommandRawReply,
        expected: {
          name: 'dbsize',
          arity: 1,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_shards', response: 'agg_sum' },
		  isKeyless: true
        }
      },
      {
        name: 'with invalid policies',
        input: ['test', 0, [], 0, 0, 0, [], ['request_policy:invalid', 'response_policy:invalid'], ['some key specification']] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: undefined },
		  isKeyless: false
        }
      },
      {
        name: 'with request policy only',
        input: ['test', 0, [], 0, 0, 0, [], ['request_policy:all_nodes'], ['some key specification']] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_nodes', response: undefined },
		  isKeyless: false
        }
      },
      {
        name: 'with response policy only',
        input: ['test', 0, [], 0, 0, 0, [], ['', 'response_policy:agg_max'], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: 'agg_max' },
		  isKeyless: true
        }
      },
      {
        name: 'with response policy only',
        input: ['test', 0, [], 0, 0, 0, [], ['', 'response_policy:agg_max'], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: 'agg_max' },
		  isKeyless: true
        }
      }
    ];

    testCases.forEach(testCase => {
      it(testCase.name, () => {
        assert.deepEqual(
          transformCommandReply(testCase.input),
          testCase.expected
        );
      });
    });
  });

  testUtils.testWithClient('client.command', async client => {
    const result = ((await client.command()).find(command => command.name === 'dbsize'));
    assert.equal(result?.name, 'dbsize');
    assert.equal(result?.arity, 1);
    assert.equal(result?.policies?.request, 'all_shards');
    assert.equal(result?.policies?.response, 'agg_sum');
  }, GLOBAL.SERVERS.OPEN);
});