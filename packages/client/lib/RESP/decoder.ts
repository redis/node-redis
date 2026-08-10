/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck -- decoder uses untyped continuation callbacks; full typing tracked separately
import { VerbatimString } from './verbatim-string';
import { SimpleError, BlobError, ErrorReply } from '../errors';
import { TypeMapping } from './types';

// https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md
export const RESP_TYPES = {
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
  PUSH: 62 // >
} as const;

const ASCII = {
  '\r': 13,
  't': 116,
  '+': 43,
  '-': 45,
  '0': 48,
  '.': 46
} as const;

// Powers of ten that are exactly representable as a double, so dividing by one
// of them rounds only once.
const POWERS_OF_10 = [
  1, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11,
  1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18, 1e19, 1e20, 1e21, 1e22
];

// Largest significand that can still absorb one more digit exactly:
// 900719925474098 * 10 + 9 is the last value <= MAX_SAFE_INTEGER.
const MAX_SIGNIFICAND_BEFORE_DIGIT = 900719925474098;

// Fallback for tokens the exact path cannot scale in one rounding. Mirrors the
// RESP2 double transformer (`transformDoubleReply[2]` in
// `../commands/generic-transformers`), so both protocol versions agree.
function slowParseDouble(buffer, start, end) {
  const string = buffer.toString(undefined, start, end);

  switch (string) {
    case 'inf':
    case '+inf':
      return Infinity;

    case '-inf':
      return -Infinity;

    case 'nan':
      return NaN;
  }

  return Number(string);
}

export const PUSH_TYPE_MAPPING = {
  [RESP_TYPES.BLOB_STRING]: Buffer
};

// this was written with performance in mind, so it's not very readable... sorry :(

interface DecoderOptions {
  onReply(reply: any): unknown;
  onErrorReply(err: ErrorReply): unknown;
  onPush(push: Array<any>): unknown;
  getTypeMapping(): TypeMapping;
}

export class Decoder {
  onReply;
  onErrorReply;
  onPush;
  getTypeMapping;
  #cursor = 0;
  #next;

  constructor(config: DecoderOptions) {
    this.onReply = config.onReply;
    this.onErrorReply = config.onErrorReply;
    this.onPush = config.onPush;
    this.getTypeMapping = config.getTypeMapping;
  }

  reset() {
    this.#cursor = 0;
    this.#next = undefined;
  }

  write(chunk) {
    if (this.#cursor >= chunk.length) {
      this.#cursor -= chunk.length;
      return;
    }

    if (this.#next) {
      if (this.#next(chunk) || this.#cursor >= chunk.length) {
        this.#cursor -= chunk.length;
        return;
      }
    }

    do {
      const type = chunk[this.#cursor];
      if (++this.#cursor === chunk.length) {
        this.#next = this.#continueDecodeTypeValue.bind(this, type);
        break;
      }

      if (this.#decodeTypeValue(type, chunk)) {
        break;
      }
    } while (this.#cursor < chunk.length);
    this.#cursor -= chunk.length;
  }

  #continueDecodeTypeValue(type, chunk) {
    this.#next = undefined;
    return this.#decodeTypeValue(type, chunk);
  }

  #decodeTypeValue(type, chunk) {
    switch (type) {
      case RESP_TYPES.NULL:
        this.onReply(this.#decodeNull());
        return false;

      case RESP_TYPES.BOOLEAN:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeBoolean(chunk)
        );

      case RESP_TYPES.NUMBER:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeNumber(
            this.getTypeMapping()[RESP_TYPES.NUMBER],
            chunk
          )
        );

      case RESP_TYPES.BIG_NUMBER:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeBigNumber(
            this.getTypeMapping()[RESP_TYPES.BIG_NUMBER],
            chunk
          )
        );

      case RESP_TYPES.DOUBLE:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeDouble(
            this.getTypeMapping()[RESP_TYPES.DOUBLE],
            chunk
          )
        );

      case RESP_TYPES.SIMPLE_STRING:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeSimpleString(
            this.getTypeMapping()[RESP_TYPES.SIMPLE_STRING],
            chunk
          )
        );

      case RESP_TYPES.BLOB_STRING:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeBlobString(
            this.getTypeMapping()[RESP_TYPES.BLOB_STRING],
            chunk
          )
        );

      case RESP_TYPES.VERBATIM_STRING:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeVerbatimString(
            this.getTypeMapping()[RESP_TYPES.VERBATIM_STRING],
            chunk
          )
        );

      case RESP_TYPES.SIMPLE_ERROR:
        return this.#handleDecodedValue(
          this.onErrorReply,
          this.#decodeSimpleError(chunk)
        );

      case RESP_TYPES.BLOB_ERROR:
        return this.#handleDecodedValue(
          this.onErrorReply,
          this.#decodeBlobError(chunk)
        );

      case RESP_TYPES.ARRAY:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeArray(this.getTypeMapping(), chunk)
        );

      case RESP_TYPES.SET:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeSet(this.getTypeMapping(), chunk)
        );

      case RESP_TYPES.MAP:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeMap(this.getTypeMapping(), chunk)
        );

      case RESP_TYPES.PUSH:
        return this.#handleDecodedValue(
          this.onPush,
          this.#decodeArray(PUSH_TYPE_MAPPING, chunk)
        );

      default:
        throw new Error(`Unknown RESP type ${type} "${String.fromCharCode(type)}"`);
    }
  }

  #handleDecodedValue(cb, value) {
    if (typeof value === 'function') {
      this.#next = this.#continueDecodeValue.bind(this, cb, value);
      return true;
    }

    cb(value);
    return false;
  }

  #continueDecodeValue(cb, next, chunk) {
    this.#next = undefined;
    return this.#handleDecodedValue(cb, next(chunk));
  }

  #decodeNull() {
    this.#cursor += 2; // skip \r\n
    return null;
  }

  #decodeBoolean(chunk) {
    const boolean = chunk[this.#cursor] === ASCII.t;
    this.#cursor += 3; // skip {t | f}\r\n
    return boolean;
  }

  #decodeNumber(type, chunk) {
    if (type === String) {
      return this.#decodeSimpleString(String, chunk);
    }

    switch (chunk[this.#cursor]) {
      case ASCII['+']:
        return this.#maybeDecodeNumberValue(false, chunk);

      case ASCII['-']:
        return this.#maybeDecodeNumberValue(true, chunk);

      default:
        return this.#decodeNumberValue(
          false,
          this.#decodeUnsingedNumber.bind(this, 0),
          chunk
        );
    }
  }

  #maybeDecodeNumberValue(isNegative, chunk) {
    const cb = this.#decodeUnsingedNumber.bind(this, 0);
    return ++this.#cursor === chunk.length ?
      this.#decodeNumberValue.bind(this, isNegative, cb) :
      this.#decodeNumberValue(isNegative, cb, chunk);
  }

  #decodeNumberValue(isNegative, numberCb, chunk) {
    const number = numberCb(chunk);
    return typeof number === 'function' ?
      this.#decodeNumberValue.bind(this, isNegative, number) :
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

  #decodeBigNumber(type, chunk) {
    if (type === String) {
      return this.#decodeSimpleString(String, chunk);
    }

    switch (chunk[this.#cursor]) {
      case ASCII['+']:
        return this.#maybeDecodeBigNumberValue(false, chunk);

      case ASCII['-']:
        return this.#maybeDecodeBigNumberValue(true, chunk);

      default:
        return this.#decodeBigNumberValue(
          false,
          this.#decodeUnsingedBigNumber.bind(this, 0n),
          chunk
        );
    }
  }

  #maybeDecodeBigNumberValue(isNegative, chunk) {
    const cb = this.#decodeUnsingedBigNumber.bind(this, 0n);
    return ++this.#cursor === chunk.length ?
      this.#decodeBigNumberValue.bind(this, isNegative, cb) :
      this.#decodeBigNumberValue(isNegative, cb, chunk);
  }

  #decodeBigNumberValue(isNegative, bigNumberCb, chunk) {
    const bigNumber = bigNumberCb(chunk);
    return typeof bigNumber === 'function' ?
      this.#decodeBigNumberValue.bind(this, isNegative, bigNumber) :
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

  #decodeDouble(type, chunk) {
    if (type === String) {
      return this.#decodeSimpleString(String, chunk);
    }

    // Digits accumulate into an integer significand, scaled by a single division
    // at the end so the value is rounded once — the exact double the server
    // encoded. Shapes that would need more than one rounding (`e` exponents,
    // significands or decimal exponents outside the exactly representable range)
    // and `inf`/`nan` go to `slowParseDouble`.
    const start = this.#cursor;
    let cursor = start;
    if (chunk[cursor] === ASCII['-'] || chunk[cursor] === ASCII['+']) {
      cursor++;
    }

    let significand = 0,
      digits = 0,
      // -1 until the decimal point is seen, then the number of digits after it.
      fractionDigits = -1;

    while (cursor < chunk.length) {
      const byte = chunk[cursor];

      if (byte === ASCII['\r']) {
        this.#cursor = cursor + 2; // skip \r\n
        if (digits === 0 || fractionDigits >= POWERS_OF_10.length) {
          return slowParseDouble(chunk, start, cursor);
        }

        const double = fractionDigits > 0 ?
          significand / POWERS_OF_10[fractionDigits] :
          significand;
        return chunk[start] === ASCII['-'] ? -double : double;
      }

      if (byte === ASCII['.'] && fractionDigits === -1) {
        fractionDigits = 0;
      } else {
        const digit = byte - ASCII['0'];
        if (digit < 0 || digit > 9 || significand > MAX_SIGNIFICAND_BEFORE_DIGIT) {
          const crlfIndex = this.#findCRLF(chunk, cursor);
          return crlfIndex === -1 ?
            this.#continueDecodeDouble.bind(this, [chunk.subarray(start)]) :
            slowParseDouble(chunk, start, crlfIndex);
        }

        significand = significand * 10 + digit;
        digits++;
        if (fractionDigits !== -1) fractionDigits++;
      }

      cursor++;
    }

    // The token continues in the next chunk; buffer it and convert once whole.
    this.#cursor = cursor;
    return this.#continueDecodeDouble.bind(this, [chunk.subarray(start)]);
  }

  #continueDecodeDouble(chunks, chunk) {
    const buffer = this.#continueDecodeSimpleString(chunks, Buffer, chunk);
    return typeof buffer === 'function' ?
      this.#continueDecodeDouble.bind(this, chunks) :
      slowParseDouble(buffer, 0, buffer.length);
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

  #decodeSimpleString(type, chunk) {
    const start = this.#cursor,
      crlfIndex = this.#findCRLF(chunk, start);
    if (crlfIndex === -1) {
      return this.#continueDecodeSimpleString.bind(
        this,
        [chunk.subarray(start)],
        type
      );
    }

    const slice = chunk.subarray(start, crlfIndex);
    return type === Buffer ?
      slice :
      slice.toString();
  }

  #continueDecodeSimpleString(chunks, type, chunk) {
    const start = this.#cursor,
      crlfIndex = this.#findCRLF(chunk, start);
    if (crlfIndex === -1) {
      chunks.push(chunk.subarray(start));
      return this.#continueDecodeSimpleString.bind(this, chunks, type);
    }

    chunks.push(chunk.subarray(start, crlfIndex));
    const buffer = Buffer.concat(chunks);
    return type === Buffer ? buffer : buffer.toString();
  }

  #decodeBlobString(type, chunk) {
    // RESP 2 bulk string null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-bulk-strings
    if (chunk[this.#cursor] === ASCII['-']) {
      this.#cursor += 4; // skip -1\r\n
      return null;
    }

    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeBlobStringLength.bind(this, length, type);
    } else if (this.#cursor >= chunk.length) {
      return this.#decodeBlobStringWithLength.bind(this, length, type);
    }

    return this.#decodeBlobStringWithLength(length, type, chunk);
  }

  #continueDecodeBlobStringLength(lengthCb, type, chunk) {
    const length = lengthCb(chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeBlobStringLength.bind(this, length, type);
    } else if (this.#cursor >= chunk.length) {
      return this.#decodeBlobStringWithLength.bind(this, length, type);
    }

    return this.#decodeBlobStringWithLength(length, type, chunk);
  }

  #decodeStringWithLength(length, skip, type, chunk) {
    const end = this.#cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this.#cursor);
      this.#cursor = chunk.length;
      return this.#continueDecodeStringWithLength.bind(
        this,
        length - slice.length,
        [slice],
        skip,
        type
      );
    }

    const slice = chunk.subarray(this.#cursor, end);
    this.#cursor = end + skip;
    return type === Buffer ?
      slice :
      slice.toString();
  }

  #continueDecodeStringWithLength(length, chunks, skip, type, chunk) {
    const end = this.#cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this.#cursor);
      chunks.push(slice);
      this.#cursor = chunk.length;
      return this.#continueDecodeStringWithLength.bind(
        this,
        length - slice.length,
        chunks,
        skip,
        type
      );
    }

    chunks.push(chunk.subarray(this.#cursor, end));
    this.#cursor = end + skip;
    const buffer = Buffer.concat(chunks);
    return type === Buffer ? buffer : buffer.toString();
  }

  #decodeBlobStringWithLength(length, type, chunk) {
    return this.#decodeStringWithLength(length, 2, type, chunk);
  }

  #decodeVerbatimString(type, chunk) {
    return this.#continueDecodeVerbatimStringLength(
      this.#decodeUnsingedNumber.bind(this, 0),
      type,
      chunk
    );
  }

  #continueDecodeVerbatimStringLength(lengthCb, type, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeVerbatimStringLength.bind(this, length, type) :
      this.#decodeVerbatimStringWithLength(length, type, chunk);
  }

  #decodeVerbatimStringWithLength(length, type, chunk) {
    const stringLength = length - 4; // skip <format>:
    if (type === VerbatimString) {
      return this.#decodeVerbatimStringFormat(stringLength, chunk);
    }

    this.#cursor += 4; // skip <format>:
    return this.#cursor >= chunk.length ?
      this.#decodeBlobStringWithLength.bind(this, stringLength, type) :
      this.#decodeBlobStringWithLength(stringLength, type, chunk);
  }

  #decodeVerbatimStringFormat(stringLength, chunk) {
    const formatCb = this.#decodeStringWithLength.bind(this, 3, 1, String);
    return this.#cursor >= chunk.length ?
      this.#continueDecodeVerbatimStringFormat.bind(this, stringLength, formatCb) :
      this.#continueDecodeVerbatimStringFormat(stringLength, formatCb, chunk);
  }

  #continueDecodeVerbatimStringFormat(stringLength, formatCb, chunk) {
    const format = formatCb(chunk);
    return typeof format === 'function' ?
      this.#continueDecodeVerbatimStringFormat.bind(this, stringLength, format) :
      this.#decodeVerbatimStringWithFormat(stringLength, format, chunk);
  }

  #decodeVerbatimStringWithFormat(stringLength, format, chunk) {
    return this.#continueDecodeVerbatimStringWithFormat(
      format,
      this.#decodeBlobStringWithLength.bind(this, stringLength, String),
      chunk
    );
  }

  #continueDecodeVerbatimStringWithFormat(format, stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeVerbatimStringWithFormat.bind(this, format, string) :
      new VerbatimString(format, string);
  }

  #decodeSimpleError(chunk) {
    const string = this.#decodeSimpleString(String, chunk);
    return typeof string === 'function' ?
      this.#continueDecodeSimpleError.bind(this, string) :
      new SimpleError(string);
  }

  #continueDecodeSimpleError(stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeSimpleError.bind(this, string) :
      new SimpleError(string);
  }

  #decodeBlobError(chunk) {
    const string = this.#decodeBlobString(String, chunk);
    return typeof string === 'function' ?
      this.#continueDecodeBlobError.bind(this, string) :
      new BlobError(string);
  }

  #continueDecodeBlobError(stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeBlobError.bind(this, string) :
      new BlobError(string);
  }

  #decodeNestedType(typeMapping, chunk) {
    const type = chunk[this.#cursor];
    return ++this.#cursor === chunk.length ?
      this.#decodeNestedTypeValue.bind(this, type, typeMapping) :
      this.#decodeNestedTypeValue(type, typeMapping, chunk);
  }

  #decodeNestedTypeValue(type, typeMapping, chunk) {
    switch (type) {
      case RESP_TYPES.NULL:
        return this.#decodeNull();

      case RESP_TYPES.BOOLEAN:
        return this.#decodeBoolean(chunk);

      case RESP_TYPES.NUMBER:
        return this.#decodeNumber(typeMapping[RESP_TYPES.NUMBER], chunk);

      case RESP_TYPES.BIG_NUMBER:
        return this.#decodeBigNumber(typeMapping[RESP_TYPES.BIG_NUMBER], chunk);

      case RESP_TYPES.DOUBLE:
        return this.#decodeDouble(typeMapping[RESP_TYPES.DOUBLE], chunk);

      case RESP_TYPES.SIMPLE_STRING:
        return this.#decodeSimpleString(typeMapping[RESP_TYPES.SIMPLE_STRING], chunk);

      case RESP_TYPES.BLOB_STRING:
        return this.#decodeBlobString(typeMapping[RESP_TYPES.BLOB_STRING], chunk);

      case RESP_TYPES.VERBATIM_STRING:
        return this.#decodeVerbatimString(typeMapping[RESP_TYPES.VERBATIM_STRING], chunk);

      case RESP_TYPES.SIMPLE_ERROR:
        return this.#decodeSimpleError(chunk);

      case RESP_TYPES.BLOB_ERROR:
        return this.#decodeBlobError(chunk);

      case RESP_TYPES.ARRAY:
        return this.#decodeArray(typeMapping, chunk);

      case RESP_TYPES.SET:
        return this.#decodeSet(typeMapping, chunk);

      case RESP_TYPES.MAP:
        return this.#decodeMap(typeMapping, chunk);

      default:
        throw new Error(`Unknown RESP type ${type} "${String.fromCharCode(type)}"`);
    }
  }

  #decodeArray(typeMapping, chunk) {
    // RESP 2 null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-arrays
    if (chunk[this.#cursor] === ASCII['-']) {
      this.#cursor += 4; // skip -1\r\n
      return null;
    }

    return this.#decodeArrayWithLength(
      this.#decodeUnsingedNumber(0, chunk),
      typeMapping,
      chunk
    );
  }

  #decodeArrayWithLength(length, typeMapping, chunk) {
    return typeof length === 'function' ?
      this.#continueDecodeArrayLength.bind(this, length, typeMapping) :
      this.#decodeArrayItems(
        new Array(length),
        0,
        typeMapping,
        chunk
      );
  }

  #continueDecodeArrayLength(lengthCb, typeMapping, chunk) {
    return this.#decodeArrayWithLength(
      lengthCb(chunk),
      typeMapping,
      chunk
    );
  }

  #decodeArrayItems(array, filled, typeMapping, chunk) {
    for (let i = filled; i < array.length; i++) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeArrayItems.bind(
          this,
          array,
          i,
          typeMapping
        );
      }

      const item = this.#decodeNestedType(typeMapping, chunk);
      if (typeof item === 'function') {
        return this.#continueDecodeArrayItems.bind(
          this,
          array,
          i,
          item,
          typeMapping
        );
      }

      array[i] = item;
    }

    return array;
  }

  #continueDecodeArrayItems(array, filled, itemCb, typeMapping, chunk) {
    const item = itemCb(chunk);
    if (typeof item === 'function') {
      return this.#continueDecodeArrayItems.bind(
        this,
        array,
        filled,
        item,
        typeMapping
      );
    }

    array[filled++] = item;

    return this.#decodeArrayItems(array, filled, typeMapping, chunk);
  }

  #decodeSet(typeMapping, chunk) {
    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeSetLength.bind(this, length, typeMapping);
    }

    return this.#decodeSetItems(
      length,
      typeMapping,
      chunk
    );
  }

  #continueDecodeSetLength(lengthCb, typeMapping, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeSetLength.bind(this, length, typeMapping) :
      this.#decodeSetItems(length, typeMapping, chunk);
  }

  #decodeSetItems(length, typeMapping, chunk) {
    return typeMapping[RESP_TYPES.SET] === Set ?
      this.#decodeSetAsSet(
        new Set(),
        length,
        typeMapping,
        chunk
      ) :
      this.#decodeArrayItems(
        new Array(length),
        0,
        typeMapping,
        chunk
      );
  }

  #decodeSetAsSet(set, remaining, typeMapping, chunk) {
    // using `remaining` instead of `length` & `set.size` to make it work even if the set contains duplicates
    while (remaining > 0) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeSetAsSet.bind(
          this,
          set,
          remaining,
          typeMapping
        );
      }

      const item = this.#decodeNestedType(typeMapping, chunk);
      if (typeof item === 'function') {
        return this.#continueDecodeSetAsSet.bind(
          this,
          set,
          remaining,
          item,
          typeMapping
        );
      }

      set.add(item);
      --remaining;
    }

    return set;
  }

  #continueDecodeSetAsSet(set, remaining, itemCb, typeMapping, chunk) {
    const item = itemCb(chunk);
    if (typeof item === 'function') {
      return this.#continueDecodeSetAsSet.bind(
        this,
        set,
        remaining,
        item,
        typeMapping
      );
    }

    set.add(item);

    return this.#decodeSetAsSet(set, remaining - 1, typeMapping, chunk);
  }

  #decodeMap(typeMapping, chunk) {
    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this.#continueDecodeMapLength.bind(this, length, typeMapping);
    }

    return this.#decodeMapItems(
      length,
      typeMapping,
      chunk
    );
  }

  #continueDecodeMapLength(lengthCb, typeMapping, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeMapLength.bind(this, length, typeMapping) :
      this.#decodeMapItems(length, typeMapping, chunk);
  }

  #decodeMapItems(length, typeMapping, chunk) {
    switch (typeMapping[RESP_TYPES.MAP]) {
      case Map:
        return this.#decodeMapAsMap(
          new Map(),
          length,
          typeMapping,
          chunk
        );

      case Array:
        return this.#decodeArrayItems(
          new Array(length * 2),
          0,
          typeMapping,
          chunk
        );

      default:
        return this.#decodeMapAsObject(
          {},
          length,
          typeMapping,
          chunk
        );
    }
  }

  #decodeMapAsMap(map, remaining, typeMapping, chunk) {
    // using `remaining` instead of `length` & `map.size` to make it work even if the map contains duplicate keys
    while (remaining > 0) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeMapAsMap.bind(
          this,
          map,
          remaining,
          typeMapping
        );
      }

      const key = this.#decodeMapKey(typeMapping, chunk);
      if (typeof key === 'function') {
        return this.#continueDecodeMapKey.bind(
          this,
          map,
          remaining,
          key,
          typeMapping
        );
      }

      if (this.#cursor >= chunk.length) {
        return this.#continueDecodeMapValue.bind(
          this,
          map,
          remaining,
          key,
          this.#decodeNestedType.bind(this, typeMapping),
          typeMapping
        );
      }

      const value = this.#decodeNestedType(typeMapping, chunk);
      if (typeof value === 'function') {
        return this.#continueDecodeMapValue.bind(
          this,
          map,
          remaining,
          key,
          value,
          typeMapping
        );
      }

      map.set(key, value);
      --remaining;
    }

    return map;
  }

  #decodeMapKey(typeMapping, chunk) {
    const type = chunk[this.#cursor];
    return ++this.#cursor === chunk.length ?
      this.#decodeMapKeyValue.bind(this, type, typeMapping) :
      this.#decodeMapKeyValue(type, typeMapping, chunk);
  }

  #decodeMapKeyValue(type, typeMapping, chunk) {
    switch (type) {
      // decode simple string map key as string (and not as buffer)
      case RESP_TYPES.SIMPLE_STRING:
        return this.#decodeSimpleString(String, chunk);

      // decode blob string map key as string (and not as buffer)
      case RESP_TYPES.BLOB_STRING:
        return this.#decodeBlobString(String, chunk);

      default:
        return this.#decodeNestedTypeValue(type, typeMapping, chunk);
    }
  }

  #continueDecodeMapKey(map, remaining, keyCb, typeMapping, chunk) {
    const key = keyCb(chunk);
    if (typeof key === 'function') {
      return this.#continueDecodeMapKey.bind(
        this,
        map,
        remaining,
        key,
        typeMapping
      );
    }

    if (this.#cursor >= chunk.length) {
      return this.#continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        this.#decodeNestedType.bind(this, typeMapping),
        typeMapping
      );
    }

    const value = this.#decodeNestedType(typeMapping, chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    map.set(key, value);
    return this.#decodeMapAsMap(map, remaining - 1, typeMapping, chunk);
  }

  #continueDecodeMapValue(map, remaining, key, valueCb, typeMapping, chunk) {
    const value = valueCb(chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    map.set(key, value);

    return this.#decodeMapAsMap(map, remaining - 1, typeMapping, chunk);
  }

  #decodeMapAsObject(object, remaining, typeMapping, chunk) {
    while (remaining > 0) {
      if (this.#cursor >= chunk.length) {
        return this.#decodeMapAsObject.bind(
          this,
          object,
          remaining,
          typeMapping
        );
      }

      const key = this.#decodeMapKey(typeMapping, chunk);
      if (typeof key === 'function') {
        return this.#continueDecodeMapAsObjectKey.bind(
          this,
          object,
          remaining,
          key,
          typeMapping
        );
      }

      if (this.#cursor >= chunk.length) {
        return this.#continueDecodeMapAsObjectValue.bind(
          this,
          object,
          remaining,
          key,
          this.#decodeNestedType.bind(this, typeMapping),
          typeMapping
        );
      }

      const value = this.#decodeNestedType(typeMapping, chunk);
      if (typeof value === 'function') {
        return this.#continueDecodeMapAsObjectValue.bind(
          this,
          object,
          remaining,
          key,
          value,
          typeMapping
        );
      }

      object[key] = value;
      --remaining;
    }

    return object;
  }

  #continueDecodeMapAsObjectKey(object, remaining, keyCb, typeMapping, chunk) {
    const key = keyCb(chunk);
    if (typeof key === 'function') {
      return this.#continueDecodeMapAsObjectKey.bind(
        this,
        object,
        remaining,
        key,
        typeMapping
      );
    }

    if (this.#cursor >= chunk.length) {
      return this.#continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        this.#decodeNestedType.bind(this, typeMapping),
        typeMapping
      );
    }

    const value = this.#decodeNestedType(typeMapping, chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    object[key] = value;

    return this.#decodeMapAsObject(object, remaining - 1, typeMapping, chunk);
  }

  #continueDecodeMapAsObjectValue(object, remaining, key, valueCb, typeMapping, chunk) {
    const value = valueCb(chunk);
    if (typeof value === 'function') {
      return this.#continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    object[key] = value;

    return this.#decodeMapAsObject(object, remaining - 1, typeMapping, chunk);
  }
}
