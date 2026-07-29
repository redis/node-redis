import { strict as assert } from 'node:assert';
import { FieldsetRegistry, PreparedFieldsets } from './registry';

describe('FieldsetRegistry', () => {
  describe('set', () => {
    it('is idempotent: same fields keep the same version', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a', 'b']);
      const version = registry.get('fs')!.version;

      registry.set('fs', ['a', 'b']);
      assert.equal(registry.get('fs')!.version, version);
    });

    it('bumps the version on a changed field list', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a', 'b']);
      const version = registry.get('fs')!.version;

      registry.set('fs', ['a', 'c']);
      assert.ok(registry.get('fs')!.version > version);
    });

    it('field order matters — reordered fields are a new version', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a', 'b']);
      const version = registry.get('fs')!.version;

      registry.set('fs', ['b', 'a']);
      assert.ok(registry.get('fs')!.version > version);
    });

    it('versions stay monotonic across discard + re-prepare', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a', 'b']);
      const version = registry.get('fs')!.version;

      registry.discard('fs');
      registry.set('fs', ['a', 'b']);
      assert.ok(registry.get('fs')!.version > version);
    });

    it('compares fields byte-wise: Buffer and string with identical bytes are equal', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a', Buffer.from('b')]);
      const version = registry.get('fs')!.version;

      registry.set('fs', [Buffer.from('a'), 'b']);
      assert.equal(registry.get('fs')!.version, version);
    });

    it('stores a copy — mutating the caller array does not affect the registry', () => {
      const registry = new FieldsetRegistry();
      const fields = ['a', 'b'];
      registry.set('fs', fields);

      fields[1] = 'mutated';
      assert.deepEqual(registry.get('fs')!.fields, ['a', 'b']);
    });

    it('accepts empty string as a fieldset name', () => {
      const registry = new FieldsetRegistry();
      registry.set('', ['a']);
      assert.ok(registry.get('') !== undefined);
    });
  });

  describe('discard', () => {
    it('returns true and bumps discardCount for a registered name', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a']);

      assert.equal(registry.discard('fs'), true);
      assert.equal(registry.discardCount, 1);
      assert.equal(registry.get('fs'), undefined);
    });

    it('no-op discard returns false and does not bump discardCount', () => {
      const registry = new FieldsetRegistry();

      assert.equal(registry.discard('missing'), false);
      assert.equal(registry.discardCount, 0);
    });

    it('repeated discards bump discardCount once', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a']);

      registry.discard('fs');
      registry.discard('fs');
      registry.discard('fs');
      assert.equal(registry.discardCount, 1);
    });
  });

  describe('discardAll', () => {
    it('returns the number of removed registrations with a single discardCount bump', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs1', ['a']);
      registry.set('fs2', ['b']);

      assert.equal(registry.discardAll(), 2);
      assert.equal(registry.discardCount, 1);
      assert.equal(registry.get('fs1'), undefined);
    });

    it('no-op on an empty registry: returns 0, no bump', () => {
      const registry = new FieldsetRegistry();

      assert.equal(registry.discardAll(), 0);
      assert.equal(registry.discardCount, 0);
    });
  });

  describe('diff', () => {
    it('returns exactly the session-only names', () => {
      const registry = new FieldsetRegistry();
      registry.set('kept', ['a']);
      registry.set('discarded', ['b']);
      registry.discard('discarded');

      assert.deepEqual(
        registry.diff(new Set(['kept', 'discarded'])),
        new Set(['discarded'])
      );
    });

    it('a discarded and re-registered name is not pending', () => {
      const registry = new FieldsetRegistry();
      registry.set('fs', ['a']);
      registry.discard('fs');
      registry.set('fs', ['b']);

      assert.deepEqual(
        registry.diff(new Set(['fs'])),
        new Set()
      );
    });
  });
});

describe('PreparedFieldsets', () => {
  it('tracks name → version', () => {
    const prepared = new PreparedFieldsets();
    prepared.set('fs', 3);

    assert.equal(prepared.get('fs'), 3);
    assert.equal(prepared.get('missing'), undefined);
  });

  it('names() returns a snapshot of tracked names', () => {
    const prepared = new PreparedFieldsets();
    prepared.set('fs1', 1);
    prepared.set('fs2', 2);

    assert.deepEqual(prepared.names(), new Set(['fs1', 'fs2']));
  });

  it('clear() wipes entries but keeps syncedDiscardCount', () => {
    const prepared = new PreparedFieldsets();
    prepared.set('fs', 1);
    prepared.syncedDiscardCount = 5;

    prepared.clear();
    assert.equal(prepared.size, 0);
    assert.equal(prepared.syncedDiscardCount, 5);
  });

  it('delete() removes a single entry', () => {
    const prepared = new PreparedFieldsets();
    prepared.set('fs1', 1);
    prepared.set('fs2', 2);

    assert.equal(prepared.delete('fs1'), true);
    assert.equal(prepared.delete('fs1'), false);
    assert.deepEqual(prepared.names(), new Set(['fs2']));
  });
});
