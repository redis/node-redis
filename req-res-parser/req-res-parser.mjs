import { readFile } from 'node:fs/promises';
import { deepEqual } from 'node:assert/strict';

// https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md
export const TYPES = {
  NULL: 95, // _
  BOOLEAN: 35, // #
  NUMBER: 58, // :
  BIG_NUMBER: 40, // (
  DOUBLE: 44, // ,
  SIMPLE_STRING: 43, // +
  BLOB_STRING: 36, // $
  VERBATIM_STRING: 61, // =
  SIMPLE_ERROR: 45, // -
  BLOB_ERROR: 33, // !
  ARRAY: 42, // *
  SET: 126, // ~
  MAP: 37, // %
  ATTRIBUTE: 124, // |
  PUSH: 62 // >
};

const ASCII = {
  '\r': 13,
  't': 116,
  '-': 45,
  '0': 48,
  '.': 46,
  'i': 105,
  'n': 110
};

// this was written with performance in mind, so it's not very readable... sorry :(

export class Decoder {
  #onReply;
  #onPush;
  #getFlags;

  constructor({
    onReply,
    onPush,
    getFlags
  }) {
    this.#onReply = onReply;
    this.#onPush = onPush;
    this.#getFlags = getFlags;
  }

  #cursor = 0;

  #continue;

  reset() {
    this.#cursor = 0;
    this.#continue = undefined;
  }

  write(chunk) {
    if (this.#cursor >= chunk.length || this.#continue?.(chunk)) {
      this.#cursor -= chunk.length;
      return;
    }

    do {
      const flags = this.#getFlags(),
        type = chunk[this.#cursor];

      if (++this.#cursor === chunk.length) {
        this.#continue = this.#continueDecodeTypeValue.bind(this, type, flags);
        break;
      }

      this.#decodeTypeValue(type, flags, chunk);
    } while (this.#cursor < chunk.length);
    this.#cursor -= chunk.length;
  }

  #continueDecodeTypeValue(type, flags, chunk) {
    this.#continue = undefined;
    this.#decodeTypeValue(type, flags, chunk);
    return this.#cursor >= chunk.length;
  }
    
  #decodeTypeValue(type, flags, chunk) {
    if (type === TYPES.PUSH) {
      this.#handleDecodedValue(
        this.#onPush,
        this.#decodeArray(flags, chunk)
      );
      return;
    }

    this.#handleDecodedValue(
      this.#onReply,
      this.#decodeReplyValue(type, flags, chunk)
    );
  }

  #decodeReplyValue(type, flags, chunk) {
    switch (type) {
      case TYPES.NULL:
        return this.#decodeNull();

      case TYPES.BOOLEAN:
        return this.#decodeBoolean(chunk);

      case TYPES.NUMBER:
        return this.#decodeNumber(chunk);

      case TYPES.BIG_NUMBER:
        return this.#decodeBigNumber(flags[TYPES.BIG_NUMBER], chunk);
      
      case TYPES.DOUBLE:
        return this.#decodeDouble(flags[TYPES.DOUBLE], chunk);
      
      case TYPES.SIMPLE_STRING:
        return this.#decodeSimpleString(flags[TYPES.SIMPLE_STRING], chunk);
      
      case TYPES.BLOB_STRING:
        return this.#decodeBlobString(flags[TYPES.BLOB_STRING], chunk);

      case TYPES.VERBATIM_STRING:
        return this.#decodeBlobString(flags[TYPES.BLOB_STRING], chunk);

      case TYPES.SIMPLE_ERROR:
        return this.#decodeSimpleError(chunk);
      
      case TYPES.BLOB_ERROR:
        return this.#decodeBlobError(chunk);

      case TYPES.ARRAY:
        return this.#decodeArray(flags, chunk);

      case TYPES.SET:
        return this.#decodeSet(flags, chunk);
      
      case TYPES.MAP:
        return this.#decodeMap(flags, chunk);

      case TYPES.ATTRIBUTE:
        throw new Error('TODO: attribute');
    }
  }

  #handleDecodedValue(cb, value) {
    if (typeof value === 'function') {
      this.#continue = this.#continueDecodeValue.bind(this, cb, value);
      return true;
    }

    cb(value);
  }

  #continueDecodeValue(cb, valueCb, chunk) {
    this.#continue = undefined;
    return this.#handleDecodedValue(cb, valueCb(chunk), chunk) ||
      this.#cursor >= chunk.length;
  }

  #decodeNull() {
    this.#cursor += 2; // skip \r\n
    return null;
  }

  #decodeBoolean(chunk) {
    const boolean = chunk[this.#cursor] === ASCII['t'];
    this.#cursor += 3; // skip {t | f}\r\n
    return boolean;
  }

  #decodeNumber(chunk) {
    const isNegative = chunk[this.#cursor] === ASCII['-'];
    if (isNegative && ++this.#cursor === chunk.length) {
      return this.#continueDecodeNumber.bind(
        this,
        isNegative,
        this.#decodeUnsingedNumber.bind(this, 0)
      );
    }

    const number = this.#decodeUnsingedNumber(0, chunk);
    return typeof number === 'function' ?
      this.#continueDecodeNumber.bind(this, isNegative, number) :
      isNegative ? -number : number;
  }

  #continueDecodeNumber(isNegative, numberCb, chunk) {
    const number = numberCb(chunk);
    return typeof number === 'function' ?
      this.#continueDecodeNumber.bind(this, isNegative, number) :
      isNegative ? -number : number;
  }

  #decodeUnsingedNumber(number, chunk) {
    let cursor = this.#cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this.#cursor = cursor + 2; // skip \r\n
        return number;
      }
      number = number * 10 + byte - ASCII['0'];
    } while (++cursor < chunk.length);

    this.#cursor = cursor;
    return this.#decodeUnsingedNumber.bind(this, number);
  }

  #decodeBigNumber(flag, chunk) {
    if (flag === String) {
      return this.#decodeSimpleString(String, chunk);
    }

    const isNegative = chunk[this.#cursor] === ASCII['-'];
    if (isNegative && ++this.#cursor === chunk.length) {
      return this.#continueDecodeBigNumber.bind(
        this,
        isNegative,
        this.#decodeUnsingedBigNumber.bind(this, 0n)
      );
    }

    const bigNumber = this.#decodeUnsingedBigNumber(0n, chunk);
    return typeof bigNumber === 'function' ?
      this.#continueDecodeNumber.bind(this, isNegative, bigNumber) :
      isNegative ? -bigNumber : bigNumber;
  }

  #continueDecodeBigNumber(isNegative, bigNumberCb, chunk) {
    const bigNumber = bigNumberCb(chunk);
    return typeof bigNumber === 'function' ?
      this.#continueDecodeBigNumber.bind(this, isNegative, bigNumber) :
      isNegative ? -bigNumber : bigNumber;
  }

  #decodeUnsingedBigNumber(bigNumber, chunk) {
    let cursor = this.#cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this.#cursor = cursor + 2; // skip \r\n
        return bigNumber;
      }
      bigNumber = bigNumber * 10n + BigInt(byte - ASCII['0']);
    } while (++cursor < chunk.length);

    this.#cursor = cursor;
    return this.#decodeUnsingedBigNumber.bind(this, bigNumber);
  }

  #decodeDouble(flag, chunk) {
    if (flag === String) {
      return this.#decodeSimpleString(String, chunk);
    }

    switch (chunk[this.#cursor]) {
      case ASCII['n']:
        this.#cursor += 5; // skip nan\r\n
        return NaN;

      case ASCII['-']:
        return ++this.#cursor === chunk.length ?
          this.#decodeDoubleInteger.bind(this, true, 0, chunk) :
          this.#decodeDoubleInteger(true, 0, chunk);

      default:
        return this.#decodeDoubleInteger(false, 0, chunk);
    }
  }

  #decodeDoubleInteger(isNegative, integer, chunk) {
    if (chunk[this.#cursor] === ASCII['i']) {
      this.#cursor += 5; // skip inf\r\n
      return isNegative ? -Infinity : Infinity;
    }

    return this.#continueDecodeDoubleInteger(isNegative, integer, chunk);
  }

  #continueDecodeDoubleInteger(isNegative, integer, chunk) {
    let cursor = this.#cursor;
    do {
      const byte = chunk[cursor];
      switch (byte) {
        case ASCII['.']:
          this.#cursor = ++cursor;
          return cursor < chunk.length ?
            this.#decodeDoubleDecimal(isNegative, 0, integer, chunk) :
            this.#decodeDoubleDecimal.bind(this, isNegative, 0, integer);

        case ASCII['\r']:
          this.#cursor = cursor + 2; // skip \r\n
          return isNegative ? -integer : integer;

        default:
          integer = integer * 10 + byte - ASCII['0'];
      }
    } while (++cursor < chunk.length);

    this.#cursor = cursor;
    return this.#continueDecodeDoubleInteger.bind(this, isNegative, integer);
  }

  // Precalculated multipliers for decimal points to improve performance
  // "A Number only keeps about 17 decimal places of precision"
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
  static #DOUBLE_DECIMAL_MULTIPLIERS = [
    0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001,
    1e-7, 1e-8, 1e-9, 1e-10, 1e-11, 1e-12,
    1e-13, 1e-14, 1e-15, 1e-16, 1e-17
  ];

  #decodeDoubleDecimal(isNegative, decimalIndex, double, chunk) {
    let cursor = this.#cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this.#cursor = cursor + 2; // skip \r\n
        return isNegative ? -double : double;
      }
      
      if (decimalIndex < Decoder.#DOUBLE_DECIMAL_MULTIPLIERS.length) {
        double += (byte - ASCII['0']) * Decoder.#DOUBLE_DECIMAL_MULTIPLIERS[decimalIndex++];
      }
    } while (++cursor < chunk.length);
    
    this.#cursor = cursor;
    return this.#decodeDoubleDecimal.bind(this, isNegative, decimalIndex, double);
  }

  #findCRLF(chunk, cursor) {
    while (chunk[cursor] !== ASCII['\r']) {
      if (++cursor === chunk.length) {
        this.#cursor = chunk.length;
        return -1;
      }
    }

    this.#cursor = cursor + 2; // skip \r\n
    return cursor;
  }

  #decodeSimpleString(flag, chunk) {
    const start = this.#cursor,
      crlfIndex = this.#findCRLF(chunk, start);
    if (crlfIndex === -1) {
      return this.#continueDecodeSimpleString.bind(
        this,
        [chunk.subarray(start)],
        flag
      );
    }

    const slice = chunk.subarray(start, crlfIndex);
    return flag === Buffer ?
      slice :
      slice.toString();
  }

  #continueDecodeSimpleString(chunks, flag, chunk) {
    const start = this.#cursor,
      crlfIndex = this.#findCRLF(chunk, start);
    if (crlfIndex === -1) {
      chunks.push(chunk.subarray(start));
      return this.#continueDecodeSimpleString.bind(this, chunks, flag);
    }

    chunks.push(chunk.subarray(start, crlfIndex));
    return flag === Buffer ?
      Buffer.concat(chunks) :
      chunks.join('');
  }

  #decodeBlobString(flag, chunk) {
    // RESP 2 bulk string null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-bulk-strings
    if (chunk[this.#cursor] === ASCII['-']) {
      this.#cursor += 4; // skip -1\r\n
      return null;
    }

    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeBlobStringLength.bind(this, length, flag);
    } else if (this.#cursor >= chunk.length) {
      return this.#decodeBlobStringWithLength.bind(this, length, flag);
    }

    return this.#decodeBlobStringWithLength(length, flag, chunk);
  }

  #continueDecodeBlobStringLength(lengthCb, flag, chunk) {
    const length = lengthCb(chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeBlobStringLength.bind(this, length, flag);
    } else if (this.#cursor >= chunk.length) {
      return this.#decodeBlobStringWithLength.bind(this, length, flag);
    }

    return this.#decodeBlobStringWithLength(length, flag, chunk);
  }

  #decodeBlobStringWithLength(length, flag, chunk) {
    const end = this.#cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this.#cursor);
      this.#cursor = chunk.length;
      return this.#continueDecodeBlobStringWithLength.bind(
        this,
        length - slice.length,
        [slice],
        flag
      );
    }

    const slice = chunk.subarray(this.#cursor, end);
    this.#cursor = end + 2; // skip ${string}\r\n
    return flag === Buffer ?
      slice :
      slice.toString();
  }

  #continueDecodeBlobStringWithLength(length, chunks, flag, chunk) {
    const end = this.#cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.slice(this.#cursor);
      chunks.push(slice);
      this.#cursor = chunk.length;
      return this.#continueDecodeBlobStringWithLength.bind(
        this,
        length - slice.length,
        chunks,
        flag
      );
    }

    chunks.push(chunk.subarray(this.#cursor, end));
    this.#cursor = end + 2; // skip ${string}\r\n
    return flag === Buffer ?
      Buffer.concat(chunks) :
      chunks.join('');
  }

  #decodeSimpleError(chunk) {
    const string = this.#decodeSimpleString(String, chunk);
    return typeof string === 'function' ?
      this.#continueDecodeSimpleError.bind(this, string) :
      new Error(string); // TODO use custom error
  }

  #continueDecodeSimpleError(stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeSimpleError.bind(this, string) :
      new Error(string); // TODO use custom error
  }

  #decodeBlobError(chunk) {
    const string = this.#decodeBlobString(String, chunk);
    return typeof string === 'function' ?
      this.#continueDecodeBlobError.bind(this, string) :
      new Error(string); // TODO use custom error
  }

  #continueDecodeBlobError(stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeBlobError.bind(this, string) :
      new Error(string); // TODO use custom error
  }

  #decodeNestedType(flags, chunk) {
    const type = chunk[this.#cursor];
    return ++this.#cursor === chunk.length ?
      this.#decodeReplyValue.bind(this, type, flags) :
      this.#decodeReplyValue(type, flags, chunk);
  }

  #decodeArray(flags, chunk) {
    // RESP 2 null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-arrays
    if (chunk[this.#cursor] === ASCII['-']) {
      this.#cursor += 4; // skip -1\r\n
      return null;
    }

    return this.#decodeArrayWithLength(
      this.#decodeUnsingedNumber(0, chunk),
      flags,
      chunk
    );
  }

  #decodeArrayWithLength(length, flags, chunk) {
    return typeof length === 'function' ?
      this.#continueDecodeArrayLength.bind(this, length, flags) :
      this.#decodeArrayItems(
        new Array(length),
        0,
        flags,
        chunk
      );
  }

  #continueDecodeArrayLength(lengthCb, flags, chunk) {
    return this.#decodeArrayWithLength(
      lengthCb(chunk),
      flags,
      chunk
    );
  }

  #decodeArrayItems(array, filled, flags, chunk) {
    for (let i = filled; i < array.length; i++) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeArrayItems.bind(
          this,
          array,
          i,
          flags
        );
      }

      const item = this.#decodeNestedType(flags, chunk);
      if (typeof item === 'function') {
        return this.#continueDecodeArrayItems.bind(
          this,
          array,
          i,
          item,
          flags
        );
      }

      array[i] = item;
    }

    return array;
  }

  #continueDecodeArrayItems(array, filled, itemCb, flags, chunk) {
    const item = itemCb(chunk);
    if (typeof item === 'function') {
      return this.#continueDecodeArrayItems.bind(
        this,
        array,
        filled,
        item,
        flags
      );
    }

    array[filled++] = item;

    return this.#decodeArrayItems(array, filled, flags, chunk);
  }

  #decodeSet(flags, chunk) {
    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeSetLength.bind(this, length, flags);
    }

    return this.#decodeSetItems(
      length,
      flags,
      chunk
    );
  }

  #continueDecodeSetLength(lengthCb, flags, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeSetLength.bind(this, length, flags) :
      this.#decodeSetItems(length, flags, chunk);
  }

  #decodeSetItems(length, flags, chunk) {
    return flags[TYPES.SET] === Set ?
      this.#decodeSetAsSet(
        new Set(),
        length,
        flags,
        chunk
      ) :
      this.#decodeArrayItems(
        new Array(length),
        0,
        flags,
        chunk
      );
  }

  #decodeSetAsSet(set, remaining, flags, chunk) {
    // using `remaining` instead of `length` & `set.size` to make it work even if the set contains duplicates
    while (remaining > 0) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeSetAsSet.bind(
          this,
          set,
          remaining,
          flags
        );
      }

      const item = this.#decodeNestedType(flags, chunk);
      if (typeof item === 'function') {
        return this.#continueDecodeSetAsSet.bind(
          this,
          set,
          remaining,
          item,
          flags
        );
      }

      set.add(item);
      --remaining;
    }

    return set;
  }

  #continueDecodeSetAsSet(set, remaining, itemCb, flags, chunk) {
    const item = itemCb(chunk);
    if (typeof item === 'function') {
      return this.#continueDecodeSetAsSet.bind(
        this,
        set,
        remaining,
        item,
        flags
      );
    }

    set.add(item);

    return this.#decodeSetAsSet(set, remaining - 1, flags, chunk);
  }

  #decodeMap(flags, chunk) {
    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeMapLength.bind(this, length, flags);
    }

    return this.#decodeMapItems(
      length,
      flags,
      chunk
    );
  }

  #continueDecodeMapLength(lengthCb, flags, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeMapLength.bind(this, length, flags) :
      this.#decodeMapItems(length, flags, chunk);
  }

  #decodeMapItems(length, flags, chunk) {
    switch (flags[TYPES.MAP]) {
      case Map:
        return this.#decodeMapAsMap(
          new Map(),
          length,
          flags,
          chunk
        );

      case Array:
        return this.#decodeArrayItems(
          new Array(length * 2),
          0,
          flags,
          chunk
        );

      default:
        return this.#decodeMapAsObject(
          Object.create(null),
          length,
          flags,
          chunk
        );
    }
  }

  #decodeMapAsMap(map, remaining, flags, chunk) {
    // using `remaining` instead of `length` & `map.size` to make it work even if the map contains duplicate keys
    while (remaining > 0) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeMapAsMap.bind(
          this,
          map,
          remaining,
          flags
        );
      }

      const key = this.#decodeMapKey(flags, chunk);
      if (typeof key === 'function') {
        return this.#continueDecodeMapKey.bind(
          this,
          map,
          remaining,
          key,
          flags
        );
      }

      if (this.#cursor >= chunk.length) {
        return this.#continueDecodeMapValue.bind(
          this,
          map,
          remaining,
          key,
          this.#decodeNestedType.bind(this, flags),
          flags
        );
      }

      const value = this.#decodeNestedType(flags, chunk);
      if (typeof value === 'function') {
        return this.#continueDecodeMapValue.bind(
          this,
          map,
          remaining,
          key,
          value,
          flags
        );
      }

      map.set(key, value);
      --remaining;
    }

    return map;
  }

  #decodeMapKey(flags, chunk) {
    const type = chunk[this.#cursor];
    return ++this.#cursor === chunk.length ?
      this.#decodeMapKeyValue.bind(this, type, flags) :
      this.#decodeMapKeyValue(type, flags, chunk);
  }

  #decodeMapKeyValue(type, flags, chunk) {
    switch (type) {
      // decode simple string map key as string (and not as buffer)
      case TYPES.SIMPLE_STRING:
        return this.#decodeSimpleString(String, chunk);
      
      // decode blob string map key as string (and not as buffer)
      case TYPES.BLOB_STRING:
        return this.#decodeBlobString(String, chunk);

      default:
        return this.#decodeReplyValue(type, flags, chunk);
    }
  }

  #continueDecodeMapKey(map, remaining, keyCb, flags, chunk) {
    const key = keyCb(chunk);
    if (typeof key === 'function') {
      return this.#continueDecodeMapKey.bind(
        this,
        map,
        remaining,
        key,
        flags
      );
    }

    if (this.#cursor >= chunk.length) {
      return this.#continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        this.#decodeNestedType.bind(this, flags),
        flags
      );
    }      

    const value = this.#decodeNestedType(flags, chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        value,
        flags
      );
    }

    map.set(key, value);
    return this.#decodeMapAsMap(map, remaining - 1, flags, chunk);
  }

  #continueDecodeMapValue(map, remaining, key, valueCb, flags, chunk) {
    const value = valueCb(chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        value,
        flags
      );
    }

    map.set(key, value);

    return this.#decodeMapAsMap(map, remaining - 1, flags, chunk);
  }

  #decodeMapAsObject(object, remaining, flags, chunk) {
    while (remaining > 0) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeMapAsObject.bind(
          this,
          object,
          remaining,
          flags
        );
      }

      const key = this.#decodeMapKey(flags, chunk);
      if (typeof key === 'function') {
        return this.#continueDecodeMapAsObjectKey.bind(
          this,
          object,
          remaining,
          key,
          flags
        );
      }

      if (this.#cursor >= chunk.length) {
        return this.#continueDecodeMapAsObjectValue.bind(
          this,
          object,
          remaining,
          key,
          this.#decodeNestedType.bind(this, flags),
          flags
        );
      }

      const value = this.#decodeNestedType(flags, chunk);
      if (typeof value === 'function') {
        return this.#continueDecodeMapAsObjectValue.bind(
          this,
          object,
          remaining,
          key,
          value,
          flags
        );
      }

      object[key] = value;
      --remaining;
    }

    return object;
  }

  #continueDecodeMapAsObjectKey(object, remaining, keyCb, flags, chunk) {
    const key = keyCb(chunk);
    if (typeof key === 'function') {
      return this.#continueDecodeMapAsObjectKey.bind(
        this,
        object,
        remaining,
        key,
        flags
      );
    }

    if (this.#cursor >= chunk.length) {
      return this.#continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        this.#decodeNestedType.bind(this, flags),
        flags
      );
    }

    const value = this.#decodeNestedType(flags, chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        value,
        flags
      );
    }

    object[key] = value;

    return this.#decodeMapAsObject(object, remaining - 1, flags, chunk);
  }

  #continueDecodeMapAsObjectValue(object, remaining, key, valueCb, flags, chunk) {
    const value = valueCb(chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        value,
        flags
      );
    }

    object[key] = value;

    return this.#decodeMapAsObject(object, remaining - 1, flags, chunk);
  }
}

async function parseFile(path) {
  const log = await readFile(path);

  let i = 0;

  function readLine() {
    const start = i;
    while (log[i++] !== 10) {}
    return log.subarray(start, i);
  }

  function readArgs() {
    const args = [];
    while (true) {
      readLine(); // skip size line
      const buffer = readLine();
      const line = buffer.subarray(0, buffer.length - 2).toString();
      if (line === '__argv_end__') {
        return args;
      } else {
        args.push(line);
      }
    }
  }

  function readReply() {
    let reply;
    const decoder = new Decoder({
      onReply(r) {
        reply = r;
      },
      onPush(p) {
        console.log('PUSH', p);
      },
      getFlags() {
        return {};
      }
    });

    const network = [];
    while (reply === undefined) {
      const toWrite = readLine();
      network.push(toWrite);
      decoder.write(toWrite);
    }

    return {
      reply,
      network: Buffer.concat(network)
    };
  }

  const reqres = [];
  while (i < log.length) {
    const item = {
      args: readArgs(),
      ...readReply()
    };
    reqres.push(item);
  }

  return reqres;
}

const [resp3, resp2] = await Promise.all([
  parseFile('/home/leibale/Workspace/redis/resp3.reqres'),
  parseFile('/home/leibale/Workspace/redis/resp2.reqres')
]);

console.log(resp2.length, resp3.length);
if (resp2.length !== resp3.length) throw 'invalid';

for (let i = 0; i < resp3.length; i++) {
  try {
    deepEqual(
      resp3[i].reply,
      resp2[i].reply
    );
  } catch (err) {
    console.log(
      resp3[i],
      '!=',
      resp2[i]
    );
  }
}
