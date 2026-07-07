import { strict as assert } from 'node:assert';
import { BasicCommandParser, prefixKey, prefixKeys } from './parser';

describe('prefixKey', () => {
  it('returns the key unchanged when prefix is undefined', () => {
    assert.equal(prefixKey(undefined, 'key'), 'key');
    const buf = Buffer.from('key');
    assert.equal(prefixKey(undefined, buf), buf);
  });

  it('concatenates two strings into a string', () => {
    const result = prefixKey('app:', 'key');
    assert.equal(typeof result, 'string');
    assert.equal(result, 'app:key');
  });

  it('returns a Buffer when the prefix is a Buffer', () => {
    const result = prefixKey(Buffer.from('app:'), 'key');
    assert.ok(Buffer.isBuffer(result));
    assert.equal((result as Buffer).toString(), 'app:key');
  });

  it('returns a Buffer when the key is a Buffer', () => {
    const result = prefixKey('app:', Buffer.from('key'));
    assert.ok(Buffer.isBuffer(result));
    assert.equal((result as Buffer).toString(), 'app:key');
  });

  it('returns a Buffer when both are Buffers', () => {
    const result = prefixKey(Buffer.from('app:'), Buffer.from('key'));
    assert.ok(Buffer.isBuffer(result));
    assert.equal((result as Buffer).toString(), 'app:key');
  });
});

describe('prefixKeys', () => {
  it('prefixes a single key into a one-element array', () => {
    assert.deepEqual(prefixKeys('app:', 'key'), ['app:key']);
  });

  it('prefixes every key of an array', () => {
    assert.deepEqual(prefixKeys('app:', ['a', 'b']), ['app:a', 'app:b']);
  });

  it('returns the keys unchanged (as an array) when there is no prefix', () => {
    assert.deepEqual(prefixKeys(undefined, 'key'), ['key']);
    assert.deepEqual(prefixKeys(undefined, ['a', 'b']), ['a', 'b']);
  });
});

describe('BasicCommandParser', () => {
  describe('without a prefix', () => {
    it('pushKey leaves keys untouched', () => {
      const parser = new BasicCommandParser();
      parser.push('GET');
      parser.pushKey('key');
      assert.deepEqual(parser.redisArgs, ['GET', 'key']);
      assert.deepEqual(parser.keys, ['key']);
      assert.equal(parser.firstKey, 'key');
    });

    it('pushKeys leaves keys untouched (array and single)', () => {
      const array = new BasicCommandParser();
      array.pushKeys(['a', 'b']);
      assert.deepEqual(array.redisArgs, ['a', 'b']);
      assert.deepEqual(array.keys, ['a', 'b']);

      const single = new BasicCommandParser();
      single.pushKeys('a');
      assert.deepEqual(single.redisArgs, ['a']);
      assert.deepEqual(single.keys, ['a']);
    });

    it('treats an empty-string prefix as no prefix', () => {
      const parser = new BasicCommandParser('');
      parser.pushKey('key');
      assert.deepEqual(parser.redisArgs, ['key']);
    });

    it('treats an empty Buffer prefix as no prefix', () => {
      const parser = new BasicCommandParser(Buffer.alloc(0));
      parser.pushKey('key');
      assert.deepEqual(parser.redisArgs, ['key']);
    });
  });

  describe('with a prefix', () => {
    it('prefixes a single key in both keys and redisArgs', () => {
      const parser = new BasicCommandParser('app:');
      parser.push('GET');
      parser.pushKey('key');
      assert.deepEqual(parser.redisArgs, ['GET', 'app:key']);
      assert.deepEqual(parser.keys, ['app:key']);
      assert.equal(parser.firstKey, 'app:key');
    });

    it('prefixes every key pushed via pushKeys', () => {
      const array = new BasicCommandParser('app:');
      array.push('MGET');
      array.pushKeys(['a', 'b']);
      assert.deepEqual(array.redisArgs, ['MGET', 'app:a', 'app:b']);
      assert.deepEqual(array.keys, ['app:a', 'app:b']);

      const single = new BasicCommandParser('app:');
      single.pushKeys('a');
      assert.deepEqual(single.keys, ['app:a']);
    });

    it('prefixes keys pushed via pushKeysLength but keeps the count unchanged', () => {
      const parser = new BasicCommandParser('app:');
      parser.push('LMPOP');
      parser.pushKeysLength(['a', 'b']);
      parser.push('LEFT');
      assert.deepEqual(parser.redisArgs, ['LMPOP', '2', 'app:a', 'app:b', 'LEFT']);
      assert.deepEqual(parser.keys, ['app:a', 'app:b']);
    });

    it('does not prefix non-key arguments (push / pushVariadic)', () => {
      const parser = new BasicCommandParser('app:');
      parser.push('SET');
      parser.pushKey('key');
      parser.push('value');
      parser.pushVariadic(['EX', '10']);
      assert.deepEqual(parser.redisArgs, ['SET', 'app:key', 'value', 'EX', '10']);
      // only the key is tracked / prefixed
      assert.deepEqual(parser.keys, ['app:key']);
    });

    it('does not prefix a routing key pushed with applyPrefix=false (e.g. SPUBLISH)', () => {
      const parser = new BasicCommandParser('app:');
      parser.push('SPUBLISH');
      parser.pushKey('channel', false);
      parser.push('message');
      assert.deepEqual(parser.redisArgs, ['SPUBLISH', 'channel', 'message']);
      // still tracked for routing, but on the raw value
      assert.deepEqual(parser.keys, ['channel']);
      assert.equal(parser.firstKey, 'channel');
    });

    it('prefixes Buffer keys', () => {
      const parser = new BasicCommandParser('app:');
      parser.pushKey(Buffer.from('key'));
      const [key] = parser.keys;
      assert.ok(Buffer.isBuffer(key));
      assert.equal((key as Buffer).toString(), 'app:key');
    });

    it('invariant: every tracked key appears, prefixed, in redisArgs', () => {
      const parser = new BasicCommandParser('app:');
      parser.push('MSET');
      parser.pushKey('a');
      parser.push('1');
      parser.pushKeys(['b', 'c']);
      for (const key of parser.keys) {
        assert.ok(
          parser.redisArgs.includes(key),
          `tracked key ${key.toString()} is missing from redisArgs`
        );
        assert.ok(key.toString().startsWith('app:'), `tracked key ${key.toString()} is not prefixed`);
      }
    });
  });
});
