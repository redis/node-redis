import { strict as assert } from 'node:assert';
import {
  StaticMetadataResolver,
  REQUEST_POLICIES_WITH_DEFAULTS,
  RESPONSE_POLICIES_WITH_DEFAULTS
} from '.';

describe('StaticMetadataResolver', () => {
  const resolver = new StaticMetadataResolver();

  describe('subcommand detection', () => {
    it('FT.SEARCH: second arg is an index name, not a subcommand', () => {
      const result = resolver.resolvePolicy({ command: 'FT.SEARCH', subcommand: 'my-index' });
      assert.equal(result.ok, true);
      if (result.ok) {
        // FT.SEARCH has no subcommands declared → falls back to parent policy
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
      }
    });

    it('MEMORY USAGE: USAGE is a declared subcommand → uses subcommand policy', () => {
      const result = resolver.resolvePolicy({ command: 'MEMORY', subcommand: 'USAGE' });
      assert.equal(result.ok, true);
      if (result.ok) {
        // MEMORY default is keyless, MEMORY USAGE is keyed
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(result.value.isKeyless, false);
      }
    });

    it('GET key: second arg is a key, not a subcommand', () => {
      const result = resolver.resolvePolicy({ command: 'GET', subcommand: 'foo' });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
      }
    });

    it('COMMAND INFO: INFO is a declared subcommand', () => {
      const result = resolver.resolvePolicy({ command: 'COMMAND', subcommand: 'INFO' });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.isKeyless, true);
      }
    });

    it('FT.SUGADD: keyed module command, no subcommand declared', () => {
      const result = resolver.resolvePolicy({ command: 'FT.SUGADD', subcommand: 'mydict' });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(result.value.isKeyless, false);
      }
    });

    it('undefined subcommand on a command with declared subcommands → parent policy', () => {
      const result = resolver.resolvePolicy({ command: 'MEMORY', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
      }
    });
  });

  describe('casing', () => {
    it('module name uppercase resolves same as lowercase', () => {
      const a = resolver.resolvePolicy({ command: 'FT.SEARCH', subcommand: undefined });
      const b = resolver.resolvePolicy({ command: 'ft.search', subcommand: undefined });
      assert.deepEqual(a, b);
    });

    it('subcommand uppercase resolves same as lowercase', () => {
      const a = resolver.resolvePolicy({ command: 'MEMORY', subcommand: 'USAGE' });
      const b = resolver.resolvePolicy({ command: 'memory', subcommand: 'usage' });
      assert.deepEqual(a, b);
    });
  });

  describe('server-`special` commands reverted to default-keyless (no HLD client recipe)', () => {
    const REVERTED: Array<{ command: string; subcommand?: string }> = [
      { command: 'INFO' },
      { command: 'MEMORY', subcommand: 'DOCTOR' },
      { command: 'MEMORY', subcommand: 'MALLOC-STATS' },
      { command: 'MEMORY', subcommand: 'STATS' },
      { command: 'LATENCY', subcommand: 'DOCTOR' },
      { command: 'LATENCY', subcommand: 'GRAPH' },
      { command: 'LATENCY', subcommand: 'HISTOGRAM' },
      { command: 'LATENCY', subcommand: 'HISTORY' },
      { command: 'LATENCY', subcommand: 'LATEST' },
      { command: 'FUNCTION', subcommand: 'STATS' },
      { command: 'HOTKEYS', subcommand: 'GET' },
      { command: 'HOTKEYS', subcommand: 'RESET' },
      { command: 'HOTKEYS', subcommand: 'START' },
      { command: 'HOTKEYS', subcommand: 'STOP' }
    ];

    for (const { command, subcommand } of REVERTED) {
      const label = subcommand ? `${command} ${subcommand}` : command;
      it(`${label} → default-keyless/default-keyless`, () => {
        const result = resolver.resolvePolicy({ command, subcommand });
        assert.equal(result.ok, true, `expected ${label} to resolve`);
        if (result.ok) {
          assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
          assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
          assert.equal(result.value.isKeyless, true);
        }
      });
    }

    it('sibling subcommands keep their server-derived policies (deep-merge)', () => {
      const purge = resolver.resolvePolicy({ command: 'MEMORY', subcommand: 'PURGE' });
      assert.equal(purge.ok, true);
      if (purge.ok) {
        assert.equal(purge.value.request, 'all_shards');
        assert.equal(purge.value.response, 'all_succeeded');
      }

      const usage = resolver.resolvePolicy({ command: 'MEMORY', subcommand: 'USAGE' });
      assert.equal(usage.ok, true);
      if (usage.ok) {
        assert.equal(usage.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED);
        assert.equal(usage.value.isKeyless, false);
      }

      const latencyReset = resolver.resolvePolicy({ command: 'LATENCY', subcommand: 'RESET' });
      assert.equal(latencyReset.ok, true);
      if (latencyReset.ok) {
        assert.equal(latencyReset.value.request, 'all_nodes');
        assert.equal(latencyReset.value.response, 'agg_sum');
      }

      const hotkeysHelp = resolver.resolvePolicy({ command: 'HOTKEYS', subcommand: 'HELP' });
      assert.equal(hotkeysHelp.ok, true);
      if (hotkeysHelp.ok) {
        assert.equal(hotkeysHelp.value.request, REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        assert.equal(hotkeysHelp.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
      }
    });

    it('FT.CURSOR READ/DEL stay special (the sole HLD client recipe)', () => {
      for (const subcommand of ['READ', 'DEL']) {
        const result = resolver.resolvePolicy({ command: 'FT.CURSOR', subcommand });
        assert.equal(result.ok, true);
        if (result.ok) {
          assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.SPECIAL);
          assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS);
        }
      }
    });

    it('SCAN keeps the server special/special (cluster-wide scan chain)', () => {
      const result = resolver.resolvePolicy({ command: 'SCAN', subcommand: '0' });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, REQUEST_POLICIES_WITH_DEFAULTS.SPECIAL);
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.SPECIAL);
      }
    });

    it('RANDOMKEY keeps the server all_shards/special (random non-nil reply)', () => {
      const result = resolver.resolvePolicy({ command: 'RANDOMKEY', subcommand: undefined });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.value.request, 'all_shards');
        assert.equal(result.value.response, RESPONSE_POLICIES_WITH_DEFAULTS.SPECIAL);
      }
    });
  });

  describe('errors', () => {
    it('unknown command in std module', () => {
      const r = resolver.resolvePolicy({ command: 'definitelynotacommand', subcommand: undefined });
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, 'unknown-command');
    });

    it('unknown module', () => {
      const r = resolver.resolvePolicy({ command: 'fakemodule.something', subcommand: undefined });
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, 'unknown-module');
    });

    it('too many dots', () => {
      const r = resolver.resolvePolicy({ command: 'a.b.c', subcommand: undefined });
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, 'wrong-command-or-module-name');
    });
  });

  describe('fallback', () => {
    it('falls back to the constructor-provided resolver on unknown command', () => {
      const fallback = new StaticMetadataResolver({
        std: {
          customping: {
            request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
            response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
            isKeyless: true
          }
        }
      });
      const chained = new StaticMetadataResolver(undefined, fallback);
      const r = chained.resolvePolicy({ command: 'customping', subcommand: undefined });
      assert.equal(r.ok, true);
    });
  });
});
