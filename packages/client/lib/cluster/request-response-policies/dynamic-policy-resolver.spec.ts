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
            response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS
          }
        }
      });

      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher, fallbackResolver);
      assert.ok(resolver instanceof StaticPolicyResolver);

      const result = resolver.resolvePolicy('ping');
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
          // policies: { request: undefined, response: undefined },
          keySpecifications: 'keyless'
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('ping');
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
          // policies: { request: undefined, response: undefined },
          keySpecifications: [Buffer.from('key')] as any
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('get');
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
          // policies: { request: 'all_shards', response: 'agg_sum' },
          keySpecifications: 'keyless'
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('dbsize');
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, 'all_shards');
        assert.equal(result.value.response, 'agg_sum');
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
          // policies: { request: 'all_shards', response: 'special' },
          keySpecifications: [Buffer.from('key')] as any
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('ft.search');
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
          // policies: { request: undefined, response: undefined },
          keySpecifications: 'keyless'
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('json.get');
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
          // policies: { request: undefined, response: undefined },
          keySpecifications: 'keyless'
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('test');
      assert.equal(result.ok, true);
    });

    it('should handle unknown commands', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('unknown');
      assert.equal(result.ok, false);
      assert.equal(result.error, 'unknown-command');
    });

    it('should handle unknown modules', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('unknown.command');
      assert.equal(result.ok, false);
      assert.equal(result.error, 'unknown-module');
    });

    it('should handle invalid command format', async () => {
      const mockCommandFetcher = createMockCommandFetcher([]);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      const result = resolver.resolvePolicy('too.many.dots.here');
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
          // policies: { request: 'all_nodes', response: undefined },
          keySpecifications: [Buffer.from('key')] as any
        },
        {
          name: 'partial-response',
          arity: 1,
          flags: new Set(),
          firstKeyIndex: 0,
          lastKeyIndex: 0,
          step: 0,
          categories: new Set(),
          // policies: { request: undefined, response: 'agg_sum' },
          keySpecifications: 'keyless'
        }
      ];

      const mockCommandFetcher = createMockCommandFetcher(mockCommands);
      const resolver = await DynamicPolicyResolverFactory.create(mockCommandFetcher);

      // Command with only request policy should fall back to defaults
      let result = resolver.resolvePolicy('partial-request');
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.ALL_NODES);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
      }

      // Command with only response policy should fall back to defaults
      result = resolver.resolvePolicy('partial-response');
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

      const result = resolver.resolvePolicy('any-command');
      assert.equal(result.ok, false);
      assert.equal(result.error, 'unknown-command');
    });
  });

  describe('integration tests', () => {
    testUtils.testWithClient('should work with real Redis client', async client => {
      const resolver = await DynamicPolicyResolverFactory.create(() => client.command());
      assert.ok(resolver instanceof StaticPolicyResolver);

      // Test that ping command is classified as keyless
      const pingResult = resolver.resolvePolicy('ping');
      if (pingResult.ok) {
        assert.equal(pingResult.value.request, REQUEST_POLICIES_WITH_DEFAULTS.ALL_SHARDS);
        assert.equal(pingResult.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.ALL_SUCCEEDED);
      } else {
        assert.fail('Expected pingResult.ok to be true');
      }

      // Test that get command is classified as keyed
      const getResult = resolver.resolvePolicy('get');
      if (getResult.ok) {
        assert.equal(getResult.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(getResult.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
      } else {
        assert.fail('Expected getResult.ok to be true');
      }

      // Test that dbsize command uses explicit policies if available
      const dbsizeResult = resolver.resolvePolicy('dbsize');

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
