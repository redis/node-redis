import { strict as assert } from 'node:assert';
import {
  StaticPolicyResolver,
  REQUEST_POLICIES_WITH_DEFAULTS,
  RESPONSE_POLICIES_WITH_DEFAULTS
} from '.';

/**
 * Snapshot of the HLD "Command Routing Policy Table" — client interpretation column.
 *
 * `default(keyless)` and `default(hashslot)` from the HLD denote "no policy
 * declared"; the client routes by the default rules. They are stored here as
 * `default-keyless` / `default-keyed` to match the resolver vocabulary.
 *
 * `ft.cursor` is mis-labeled `default-keyless` in this table on purpose.
 * The HLD specifies `special` request_policy (sticky cursor), which requires
 * the special-handler registry and cursor binding state. That work is tracked
 * in its own story — once those land, the entry below flips to `special` and
 * an extra cursor-routing test goes with it.
 */
const KEYLESS = {
  request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
  response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYLESS,
  isKeyless: true
} as const;

const KEYED = {
  request: REQUEST_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED,
  response: RESPONSE_POLICIES_WITH_DEFAULTS.DEFAULT_KEYED,
  isKeyless: false
} as const;

const HLD_FT_TABLE: Record<string, typeof KEYLESS | typeof KEYED> = {
  'FT.CREATE':       KEYLESS,
  'FT.SEARCH':       KEYLESS,
  'FT.AGGREGATE':    KEYLESS,
  'FT.DICTADD':      KEYLESS,
  'FT.DICTDEL':      KEYLESS,
  'FT.DICTDUMP':     KEYLESS,
  'FT.SUGLEN':       KEYED,
  'FT.CURSOR':       KEYLESS,
  'FT.SUGADD':       KEYED,
  'FT.SUGGET':       KEYED,
  'FT.SUGDEL':       KEYED,
  'FT.SPELLCHECK':   KEYLESS,
  'FT.EXPLAIN':      KEYLESS,
  'FT.EXPLAINCLI':   KEYLESS,
  'FT.ALIASADD':     KEYLESS,
  'FT.ALIASUPDATE':  KEYLESS,
  'FT.ALIASDEL':     KEYLESS,
  'FT.INFO':         KEYLESS,
  'FT.TAGVALS':      KEYLESS,
  'FT.SYNDUMP':      KEYLESS,
  'FT.SYNUPDATE':    KEYLESS,
  'FT.PROFILE':      KEYLESS,
  'FT.ALTER':        KEYLESS,
  'FT.DROPINDEX':    KEYLESS,
  'FT.DROP':         KEYLESS
};

describe('FT.* policy table matches the HLD', () => {
  const resolver = new StaticPolicyResolver();

  for (const [command, expected] of Object.entries(HLD_FT_TABLE)) {
    it(`${command} resolves to the HLD policy`, () => {
      const result = resolver.resolvePolicy({ command, subcommand: undefined });
      assert.equal(result.ok, true, `expected ${command} to resolve`);
      if (result.ok) {
        assert.equal(result.value.request, expected.request, `${command} request`);
        assert.equal(result.value.response, expected.response, `${command} response`);
        assert.equal(result.value.isKeyless, expected.isKeyless, `${command} isKeyless`);
      }
    });
  }

  it('does not expose dropped debug commands (e.g. FT._LIST)', () => {
    const result = resolver.resolvePolicy({ command: 'FT._LIST', subcommand: undefined });
    assert.equal(result.ok, false);
  });

  it('does not expose stray cluster-admin commands (e.g. FT.CLUSTERSET)', () => {
    const result = resolver.resolvePolicy({ command: 'FT.CLUSTERSET', subcommand: undefined });
    assert.equal(result.ok, false);
  });
});
