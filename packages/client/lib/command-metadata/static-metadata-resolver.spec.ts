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
    it('falls back to provided resolver on unknown command', () => {
      const fallback = new StaticMetadataResolver({
        std: {
          customping: {
            request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
            response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
            isKeyless: true
          }
        }
      });
      const chained = resolver.withFallback(fallback);
      const r = chained.resolvePolicy({ command: 'customping', subcommand: undefined });
      assert.equal(r.ok, true);
    });
  });
});
