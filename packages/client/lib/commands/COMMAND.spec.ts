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
        input: ['ping', -1, [CommandFlags.STALE], 0, 0, 0, [CommandCategories.FAST], [], [], []] satisfies CommandRawReply,
        expected: {
          name: 'ping',
          arity: -1,
          flags: new Set([CommandFlags.STALE]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([CommandCategories.FAST]),
          policies: { request: undefined, response: undefined },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        name: 'with valid policies',
        input: ['dbsize', 1, [], 0, 0, 0, [], ['request_policy:all_shards', 'response_policy:agg_sum'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'dbsize',
          arity: 1,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_shards', response: 'agg_sum' },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        name: 'with invalid policies',
        input: ['test', 0, [], 0, 0, 0, [], ['request_policy:invalid', 'response_policy:invalid'], ['some key specification'], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: undefined },
          isKeyless: false,
          subcommands: []
        }
      },
      {
        name: 'with request policy only',
        input: ['test', 0, [], 0, 0, 0, [], ['request_policy:all_nodes'], ['some key specification'], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_nodes', response: undefined },
          isKeyless: false,
          subcommands: []
        }
      },
      {
        name: 'with response policy only',
        input: ['test', 0, [], 0, 0, 0, [], ['', 'response_policy:agg_max'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: 'agg_max' },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        name: 'with response policy only',
        input: ['test', 0, [], 0, 0, 0, [], ['', 'response_policy:agg_max'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: 'agg_max' },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        // INFO declares tips in this order on a live server; the parser must not
        // depend on policy tips being first
        name: 'with policies after a non-policy tip',
        input: ['info', -1, [], 0, 0, 0, [], ['nondeterministic_output', 'request_policy:all_shards', 'response_policy:special'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'info',
          arity: -1,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_shards', response: 'special' },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        // CLUSTER SLOT-STATS shape: non-policy tip first, request policy only
        name: 'with request policy after a non-policy tip',
        input: ['test', 0, [], 0, 0, 0, [], ['nondeterministic_output', 'request_policy:all_shards'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_shards', response: undefined },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        // KEYS shape: policy first, trailing non-policy tip must not be
        // misread as a response policy
        name: 'with non-policy tip after request policy',
        input: ['keys', 2, [], 0, 0, 0, [], ['request_policy:all_shards', 'nondeterministic_output'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'keys',
          arity: 2,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: 'all_shards', response: undefined },
          isKeyless: true,
          subcommands: []
        }
      },
      {
        name: 'with only non-policy tips',
        input: ['test', 0, [], 0, 0, 0, [], ['nondeterministic_output', 'nondeterministic_output_order'], [], []] satisfies CommandRawReply,
        expected: {
          name: 'test',
          arity: 0,
          flags: new Set([]),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set([]),
          policies: { request: undefined, response: undefined },
          isKeyless: true,
          subcommands: []
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
    const commands = await client.command();

    const result = commands.find(command => command.name === 'dbsize');
    assert.equal(result?.name, 'dbsize');
    assert.equal(result?.arity, 1);
    assert.equal(result?.policies?.request, 'all_shards');
    assert.equal(result?.policies?.response, 'agg_sum');

    // INFO declares 'nondeterministic_output' before its policy tips —
    // regression guard for positional tips parsing
    const info = commands.find(command => command.name === 'info');
    assert.equal(info?.policies?.request, 'all_shards');
    assert.equal(info?.policies?.response, 'special');
  }, GLOBAL.SERVERS.OPEN);
});
