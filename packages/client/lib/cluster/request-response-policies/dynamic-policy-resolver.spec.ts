import { strict as assert } from 'node:assert';
import type { CommandReply } from '../../commands/generic-transformers';
import { DynamicPolicyResolverFactory, type CommandFetcher, StaticPolicyResolver, REQUEST_POLICIES_WITH_DEFAULTS, RESPONSE_POLICIES_WITH_DEFAULTS } from '.';
import testUtils, { GLOBAL } from '../../test-utils';


const createMockCommandFetcher = (commands: Array<CommandReply>): CommandFetcher => async () => commands;

describe('DynamicPolicyResolverFactory', () => {

  describe('create', () => {
    it('should create StaticPolicyResolver with empty policies', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);
      assert.ok(resolver instanceof StaticPolicyResolver);
    });

    it('should create StaticPolicyResolver with fallback', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const fallbackResolver = new StaticPolicyResolver({
        std: {
          ping: {
            request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
            response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
            isKeyless: true
          }
        }
      });

      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher, fallbackResolver);
      assert.ok(resolver instanceof StaticPolicyResolver);

      const result = resolver.resolvePolicy({ command: 'ping', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
      }
    });
  });

  describe('create with commands', () => {
    it('should classify keyless commands correctly', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'ping',
          arity: -1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          policies: { request: undefined, response: undefined },
          isKeyless: true,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'ping', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
      }
    });

    it('should classify keyed commands correctly', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'get',
          arity: 2,
          flags: new Set(),
          firstKeyIndex: 1,
          lastKeyIndex: 1,
          step: 1,
          categories: new Set(),
          policies: { request: undefined, response: undefined },
          isKeyless: false,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'get', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
      }
    });

    it('should use explicit policies when available', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'dbsize',
          arity: 1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          policies: { request: 'all_shards', response: 'agg_sum' },
          isKeyless: true,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'dbsize', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, 'all_shards');
        assert.equal(result.value.response, 'agg_sum');
      }
    });

    it('should carry keySpecs through for multi_shard commands only', async () => {
      const msetKeySpecs = [{
        beginSearch: { type: 'index', index: 1 },
        findKeys: { type: 'range', lastKey: -1, keyStep: 2, limit: 0 }
      }] as const;
      const mockCommands: Array<CommandReply> = [
        {
          name: 'mset',
          arity: -3,
          flags: new Set(),
          firstKeyIndex: 1,
          lastKeyIndex: -1,
          step: 2,
          categories: new Set(),
          policies: { request: 'multi_shard', response: 'all_succeeded' },
          isKeyless: false,
          keySpecs: [...msetKeySpecs],
          subcommands: []
        },
        {
          name: 'get',
          arity: 2,
          flags: new Set(),
          firstKeyIndex: 1,
          lastKeyIndex: 1,
          step: 1,
          categories: new Set(),
          policies: { request: undefined, response: undefined },
          isKeyless: false,
          keySpecs: [{
            beginSearch: { type: 'index', index: 1 },
            findKeys: { type: 'range', lastKey: 0, keyStep: 1, limit: 0 }
          }],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const msetResult = resolver.resolvePolicy({ command: 'mset', subcommand: undefined });
      assert.equal(msetResult.ok, true);
      if (msetResult.ok) {
        assert.deepEqual(msetResult.value.keySpecs, msetKeySpecs);
      }

      // non-multi_shard commands never split — no keySpecs on their entries
      const getResult = resolver.resolvePolicy({ command: 'get', subcommand: undefined });
      assert.equal(getResult.ok, true);
      if (getResult.ok) {
        assert.equal(getResult.value.keySpecs, undefined);
      }
    });

    it('should handle module commands correctly', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'ft.search',
          arity: -2,
          flags: new Set(),
          firstKeyIndex: 1,
          lastKeyIndex: 1,
          step: 1,
          categories: new Set(),
          policies: { request: 'all_shards', response: 'special' },
          isKeyless: false,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'ft.search', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, 'all_shards');
        assert.equal(result.value.response, 'special');
      }
    });

    it('should handle valid module commands', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'json.get',
          arity: 1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          policies: { request: undefined, response: undefined },
          isKeyless: true,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'json.get', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
      }
    });
  });

  describe('resolvePolicy', () => {
    it('should work with created resolver', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'test',
          arity: 1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          policies: { request: undefined, response: undefined },
          isKeyless: true,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'test', subcommand: undefined });
      assert.equal(result.ok, true);
    });

    it('should handle unknown commands', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'unknown', subcommand: undefined });
      assert.equal(result.ok, false);
      assert.equal(result.error, 'unknown-command');
    });

    it('should handle unknown modules', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'unknown.command', subcommand: undefined });
      assert.equal(result.ok, false);
      assert.equal(result.error, 'unknown-module');
    });

    it('should handle invalid command format', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy({ command: 'too.many.dots.here', subcommand: undefined });
      assert.equal(result.ok, false);
      assert.equal(result.error, 'wrong-command-or-module-name');
    });
  });

  describe('edge cases', () => {
    it('should handle commands with partial policies', async () => {
      const mockCommands: Array<CommandReply> = [
        {
          name: 'partial-request',
          arity: 1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          policies: { request: 'all_nodes', response: undefined },
          isKeyless: false,
          keySpecs: [],
          subcommands: []
        },
        {
          name: 'partial-response',
          arity: 1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          policies: { request: undefined, response: 'agg_sum' },
          isKeyless: true,
          keySpecs: [],
          subcommands: []
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      // Command with only request policy should fall back to defaults
      let result = resolver.resolvePolicy({ command: 'partial-request', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.ALL_NODES);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
      }

      // Command with only response policy should fall back to defaults
      result = resolver.resolvePolicy({ command: 'partial-response', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.AGG_SUM);
      }
    });

    it('should handle empty command list', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);
      assert.ok(resolver instanceof StaticPolicyResolver);

      const result = resolver.resolvePolicy({ command: 'any-command', subcommand: undefined });
      assert.equal(result.ok, false);
      assert.equal(result.error, 'unknown-command');
    });
  });

  describe('integration tests', () => {
    testUtils.testWithClient('should work with real Redis client', async client => {
      const resolver = await DynamicPolicyResolverFactory.create(() => client.command());
      assert.ok(resolver instanceof StaticPolicyResolver);

      // Test that ping command is classified as keyless
      const pingResult = resolver.resolvePolicy({ command: 'ping', subcommand: undefined });
      if (pingResult.ok) {
        assert.equal(pingResult.value.request, REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS);
        assert.equal(pingResult.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.ALL_SUCCEEDED);
      } else {
        assert.fail('Expected pingResult.ok to be true');
      }

      // Test that get command is classified as keyed
      const getResult = resolver.resolvePolicy({ command: 'get', subcommand: undefined });
      if (getResult.ok) {
        assert.equal(getResult.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(getResult.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
      } else {
        assert.fail('Expected getResult.ok to be true');
      }

      // Test that dbsize command uses explicit policies if available
      const dbsizeResult = resolver.resolvePolicy({ command: 'dbsize', subcommand: undefined });

      if (dbsizeResult.ok) {
        assert.ok(
          dbsizeResult.value.request === 'all_shards' && dbsizeResult.value.response === 'agg_sum'
        );
      } else {
        assert.fail('Expected dbsizeResult.ok to be true');
      }
    }, GLOBAL.SERVERS.OPEN);
  });
});
