import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs, transformCommandReply, transformKeySpec, CommandFlags, CommandCategories, CommandRawReply } from './generic-transformers';
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
          nondeterministicOutput: false,
          tips: [],
          keySpecs: [],
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
          nondeterministicOutput: false,
          tips: [],
          keySpecs: [],
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
          nondeterministicOutput: false,
          // invalid policy tips are still recognized as policy tips and dropped
          tips: [],
          keySpecs: [{ beginSearch: { type: 'unknown' }, findKeys: { type: 'unknown' } }],
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
          nondeterministicOutput: false,
          tips: [],
          keySpecs: [{ beginSearch: { type: 'unknown' }, findKeys: { type: 'unknown' } }],
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
          nondeterministicOutput: false,
          // the leading '' is a non-policy tip and is mirrored verbatim
          tips: [''],
          keySpecs: [],
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
          nondeterministicOutput: true,
          tips: ['nondeterministic_output'],
          keySpecs: [],
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
          nondeterministicOutput: true,
          tips: ['nondeterministic_output'],
          keySpecs: [],
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
          nondeterministicOutput: true,
          tips: ['nondeterministic_output'],
          keySpecs: [],
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
          nondeterministicOutput: true,
          tips: ['nondeterministic_output', 'nondeterministic_output_order'],
          keySpecs: [],
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

  describe('transformKeySpec', () => {
    // Shapes captured from a live Redis 8.8.0 COMMAND INFO reply: RESP3
    // delivers nested objects, RESP2 the same data as flat field-value pair
    // arrays. Both must parse to the same (RESP3-like) result.
    const testCases = [
      {
        name: 'range (MSET)',
        resp3: {
          flags: ['OW', 'update'],
          begin_search: { type: 'index', spec: { index: 1 } },
          find_keys: { type: 'range', spec: { lastkey: -1, keystep: 2, limit: 0 } }
        },
        resp2: [
          'flags', ['OW', 'update'],
          'begin_search', ['type', 'index', 'spec', ['index', 1]],
          'find_keys', ['type', 'range', 'spec', ['lastkey', -1, 'keystep', 2, 'limit', 0]]
        ],
        expected: {
          beginSearch: { type: 'index', index: 1 },
          findKeys: { type: 'range', lastKey: -1, keyStep: 2, limit: 0 }
        }
      },
      {
        name: 'keynum (MSETEX)',
        resp3: {
          flags: ['OW', 'update'],
          begin_search: { type: 'index', spec: { index: 1 } },
          find_keys: { type: 'keynum', spec: { keynumidx: 0, firstkey: 1, keystep: 2 } }
        },
        resp2: [
          'flags', ['OW', 'update'],
          'begin_search', ['type', 'index', 'spec', ['index', 1]],
          'find_keys', ['type', 'keynum', 'spec', ['keynumidx', 0, 'firstkey', 1, 'keystep', 2]]
        ],
        expected: {
          beginSearch: { type: 'index', index: 1 },
          findKeys: { type: 'keynum', keyNumIdx: 0, firstKey: 1, keyStep: 2 }
        }
      },
      {
        name: 'keyword (GEORADIUS STORE)',
        resp3: {
          flags: ['OW', 'update'],
          begin_search: { type: 'keyword', spec: { keyword: 'STORE', startfrom: 6 } },
          find_keys: { type: 'range', spec: { lastkey: 0, keystep: 1, limit: 0 } }
        },
        resp2: [
          'flags', ['OW', 'update'],
          'begin_search', ['type', 'keyword', 'spec', ['keyword', 'STORE', 'startfrom', 6]],
          'find_keys', ['type', 'range', 'spec', ['lastkey', 0, 'keystep', 1, 'limit', 0]]
        ],
        expected: {
          beginSearch: { type: 'keyword', keyword: 'STORE', startFrom: 6 },
          findKeys: { type: 'range', lastKey: 0, keyStep: 1, limit: 0 }
        }
      },
      {
        name: 'unrecognized types',
        resp3: {
          begin_search: { type: 'future-type', spec: { whatever: 1 } },
          find_keys: { type: 'future-type', spec: { whatever: 1 } }
        },
        resp2: [
          'begin_search', ['type', 'future-type', 'spec', ['whatever', 1]],
          'find_keys', ['type', 'future-type', 'spec', ['whatever', 1]]
        ],
        expected: {
          beginSearch: { type: 'unknown' },
          findKeys: { type: 'unknown' }
        }
      }
    ];

    testCases.forEach(testCase => {
      it(`${testCase.name} - RESP3 shape`, () => {
        assert.deepEqual(transformKeySpec(testCase.resp3), testCase.expected);
      });

      it(`${testCase.name} - RESP2 shape`, () => {
        assert.deepEqual(transformKeySpec(testCase.resp2), testCase.expected);
      });
    });

    it('malformed entries parse to unknown instead of throwing', () => {
      const unknown = { beginSearch: { type: 'unknown' }, findKeys: { type: 'unknown' } };
      assert.deepEqual(transformKeySpec('some key specification'), unknown);
      assert.deepEqual(transformKeySpec(null), unknown);
      assert.deepEqual(transformKeySpec(['odd', 'pair', 'array']), unknown);
      assert.deepEqual(transformKeySpec({
        begin_search: { type: 'index', spec: { index: 'not-a-number' } },
        find_keys: { type: 'range', spec: { lastkey: -1 } }
      }), unknown);
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

    const mset = commands.find(command => command.name === 'mset');
    assert.deepEqual(mset?.keySpecs, [{
      beginSearch: { type: 'index', index: 1 },
      findKeys: { type: 'range', lastKey: -1, keyStep: 2, limit: 0 }
    }]);
  }, GLOBAL.SERVERS.OPEN);
});
