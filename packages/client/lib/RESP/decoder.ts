// @ts-nocheck
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
  '.': 46,
  'i': 105,
  'n': 110,
  'E': 69,
  'e': 101
} as const;

export const PUSH_TYPE_MAPPING = {
  [RESP_TYPES.BLOB_STRING]: Buffer
};

// this was written with performance in mind, so it's not very readable... sorry :(
// using `private _` instead of `#` to boost performance

interface DecoderOptions {
  onReply(reply: any): unknown;
  onErrorReply(err: ErrorReply): unknown;
  onPush(push: Array<any>): unknown;
  getTypeMapping(): TypeMapping;
}

export class Decoder {
  private readonly _config;

  private _cursor = 0;

  private _next;

  constructor(config: DecoderOptions) {
    this._config = config;
  }

  reset() {
    this._cursor = 0;
    this._next = undefined;
  }

  write(chunk) {
    if (this._cursor >= chunk.length) {
      this._cursor -= chunk.length;
      return;
    }

    if (this._next) {
      if (this._next(chunk) || this._cursor >= chunk.length) {
        this._cursor -= chunk.length;
        return;
      }
    }

    do {
      const type = chunk[this._cursor];
      if (++this._cursor === chunk.length) {
        this._next = this._continueDecodeTypeValue.bind(this, type);
        break;
      }

      if (this._decodeTypeValue(type, chunk)) {
        break;
      }
    } while (this._cursor < chunk.length);
    this._cursor -= chunk.length;
  }

  private _continueDecodeTypeValue(type, chunk) {
    this._next = undefined;
    return this._decodeTypeValue(type, chunk);
  }
    
  private _decodeTypeValue(type, chunk) {
    switch (type) {
      case RESP_TYPES.NULL:
        this._config.onReply(this._decodeNull());
        return false;

      case RESP_TYPES.BOOLEAN:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeBoolean(chunk)
        );

      case RESP_TYPES.NUMBER:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeNumber(
            this._config.getTypeMapping()[RESP_TYPES.NUMBER],
            chunk
          )
        );

      case RESP_TYPES.BIG_NUMBER:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeBigNumber(
            this._config.getTypeMapping()[RESP_TYPES.BIG_NUMBER],
            chunk
          )
        );
      
      case RESP_TYPES.DOUBLE:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeDouble(
            this._config.getTypeMapping()[RESP_TYPES.DOUBLE],
            chunk
          )
        );
      
      case RESP_TYPES.SIMPLE_STRING:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeSimpleString(
            this._config.getTypeMapping()[RESP_TYPES.SIMPLE_STRING],
            chunk
          )
        );
      
      case RESP_TYPES.BLOB_STRING:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeBlobString(
            this._config.getTypeMapping()[RESP_TYPES.BLOB_STRING],
            chunk
          )
        );

      case RESP_TYPES.VERBATIM_STRING:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeVerbatimString(
            this._config.getTypeMapping()[RESP_TYPES.VERBATIM_STRING],
            chunk
          )
        );

      case RESP_TYPES.SIMPLE_ERROR:
        return this._handleDecodedValue(
          this._config.onErrorReply,
          this._decodeSimpleError(chunk)
        );
      
      case RESP_TYPES.BLOB_ERROR:
        return this._handleDecodedValue(
          this._config.onErrorReply,
          this._decodeBlobError(chunk)
        );

      case RESP_TYPES.ARRAY:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeArray(this._config.getTypeMapping(), chunk)
        );

      case RESP_TYPES.SET:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeSet(this._config.getTypeMapping(), chunk)
        );
      
      case RESP_TYPES.MAP:
        return this._handleDecodedValue(
          this._config.onReply,
          this._decodeMap(this._config.getTypeMapping(), chunk)
        );

      case RESP_TYPES.PUSH:
        return this._handleDecodedValue(
          this._config.onPush,
          this._decodeArray(PUSH_TYPE_MAPPING, chunk)
        );

      default:
        throw new Error(`Unknown RESP type ${type} "${String.fromCharCode(type)}"`);
    }
  }

  private _handleDecodedValue(cb, value) {
    if (typeof value === 'function') {
      this._next = this._continueDecodeValue.bind(this, cb, value);
      return true;
    }

    cb(value);
    return false;
  }

  private _continueDecodeValue(cb, next, chunk) {
    this._next = undefined;
    return this._handleDecodedValue(cb, next(chunk));
  }

  private _decodeNull() {
    this._cursor += 2; // skip \r\n
    return null;
  }

  private _decodeBoolean(chunk) {
    const boolean = chunk[this._cursor] === ASCII.t;
    this._cursor += 3; // skip {t | f}\r\n
    return boolean;
  }

  private _decodeNumber(type, chunk) {
    if (type === String) {
      return this._decodeSimpleString(String, chunk);
    }

    switch (chunk[this._cursor]) {
      case ASCII['+']:
        return this._maybeDecodeNumberValue(false, chunk);

      case ASCII['-']:
        return this._maybeDecodeNumberValue(true, chunk);

      default:
        return this._decodeNumberValue(
          false,
          this._decodeUnsingedNumber.bind(this, 0),
          chunk
        );
    }
  }

  private _maybeDecodeNumberValue(isNegative, chunk) {
    const cb = this._decodeUnsingedNumber.bind(this, 0);
    return ++this._cursor === chunk.length ?
      this._decodeNumberValue.bind(isNegative, cb) :
      this._decodeNumberValue(isNegative, cb, chunk);
  }

  private _decodeNumberValue(isNegative, numberCb, chunk) {
    const number = numberCb(chunk);
    return typeof number === 'function' ?
      this._decodeNumberValue.bind(this, isNegative, number) :
      isNegative ? -number : number;
  }

  private _decodeUnsingedNumber(number, chunk) {
    let cursor = this._cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this._cursor = cursor + 2; // skip \r\n
        return number;
      }
      number = number * 10 + byte - ASCII['0'];
    } while (++cursor < chunk.length);

    this._cursor = cursor;
    return this._decodeUnsingedNumber.bind(this, number);
  }

  private _decodeBigNumber(type, chunk) {
    if (type === String) {
      return this._decodeSimpleString(String, chunk);
    }

    switch (chunk[this._cursor]) {
      case ASCII['+']:
        return this._maybeDecodeBigNumberValue(false, chunk);

      case ASCII['-']:
        return this._maybeDecodeBigNumberValue(true, chunk);

      default:
        return this._decodeBigNumberValue(
          false,
          this._decodeUnsingedBigNumber.bind(this, 0n),
          chunk
        );
    }
  }

  private _maybeDecodeBigNumberValue(isNegative, chunk) {
    const cb = this._decodeUnsingedBigNumber.bind(this, 0n);
    return this._cursor === chunk.length ?
      this._decodeBigNumberValue.bind(isNegative, cb) :
      this._decodeBigNumberValue(isNegative, cb, chunk);
  }

  private _decodeBigNumberValue(isNegative, bigNumberCb, chunk) {
    const bigNumber = bigNumberCb(chunk);
    return typeof bigNumber === 'function' ?
      this._decodeBigNumberValue.bind(this, isNegative, bigNumber) :
      isNegative ? -bigNumber : bigNumber;
  }

  private _decodeUnsingedBigNumber(bigNumber, chunk) {
    let cursor = this._cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this._cursor = cursor + 2; // skip \r\n
        return bigNumber;
      }
      bigNumber = bigNumber * 10n + BigInt(byte - ASCII['0']);
    } while (++cursor < chunk.length);

    this._cursor = cursor;
    return this._decodeUnsingedBigNumber.bind(this, bigNumber);
  }

  private _decodeDouble(type, chunk) {
    if (type === String) {
      return this._decodeSimpleString(String, chunk);
    }

    switch (chunk[this._cursor]) {
      case ASCII.n:
        this._cursor += 5; // skip nan\r\n
        return NaN;

      case ASCII['+']:
        return this._maybeDecodeDoubleInteger(false, chunk);

      case ASCII['-']:
        return this._maybeDecodeDoubleInteger(true, chunk);

      default:
        return this._decodeDoubleInteger(false, 0, chunk);
    }
  }

  private _maybeDecodeDoubleInteger(isNegative, chunk) {
    return ++this._cursor === chunk.length ?
      this._decodeDoubleInteger.bind(this, isNegative, 0) :
      this._decodeDoubleInteger(true, 0, chunk);
  }

  private _decodeDoubleInteger(isNegative, integer, chunk) {
    if (chunk[this._cursor] === ASCII.i) {
      this._cursor += 5; // skip inf\r\n
      return isNegative ? -Infinity : Infinity;
    }

    return this._continueDecodeDoubleInteger(isNegative, integer, chunk);
  }

  private _continueDecodeDoubleInteger(isNegative, integer, chunk) {
    let cursor = this._cursor;
    do {
      const byte = chunk[cursor];
      switch (byte) {
        case ASCII['.']:
          this._cursor = cursor + 1; // skip .
          return cursor < chunk.length ?
            this._decodeDoubleDecimal(isNegative, 0, integer, chunk) :
            this._decodeDoubleDecimal.bind(this, isNegative, 0, integer);

        case ASCII.E:
        case ASCII.e:
          this._cursor = cursor + 1; // skip e
          return this._decodeDoubleExponent(isNegative ? -integer : integer, chunk);

        case ASCII['\r']:
          this._cursor = cursor + 2; // skip \r\n
          return isNegative ? -integer : integer;

        default:
          integer = integer * 10 + byte - ASCII['0'];
      }
    } while (++cursor < chunk.length);

    this._cursor = cursor;
    return this._continueDecodeDoubleInteger.bind(this, isNegative, integer);
  }

  // Precalculated multipliers for decimal points to improve performance
  // "... about 15 to 17 decimal places ..."
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#:~:text=about%2015%20to%2017%20decimal%20places
  static _DOUBLE_DECIMAL_MULTIPLIERS = [
    1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6,
    1e-7, 1e-8, 1e-9, 1e-10, 1e-11, 1e-12,
    1e-13, 1e-14, 1e-15, 1e-16, 1e-17
  ];

  private _decodeDoubleDecimal(isNegative, decimalIndex, double, chunk) {
    let cursor = this._cursor;
    do {
      const byte = chunk[cursor];
      switch (byte) {
        case ASCII.E:
        case ASCII.e:
          this._cursor = cursor + 1; // skip e
          const d = isNegative ? -double : double;
          return this._cursor === chunk.length ?
            this._decodeDoubleExponent.bind(this, d, false, 0) :
            this._decodeDoubleExponent(d, false, 0, chunk);
        
        case ASCII['\r']:
          this._cursor = cursor + 2; // skip \r\n
          return isNegative ? -double : double;
      }
      
      if (decimalIndex < Decoder._DOUBLE_DECIMAL_MULTIPLIERS.length) {
        double += (byte - ASCII['0']) * Decoder._DOUBLE_DECIMAL_MULTIPLIERS[decimalIndex++];
      }
    } while (++cursor < chunk.length);
    
    this._cursor = cursor;
    return this._decodeDoubleDecimal.bind(this, isNegative, decimalIndex, double);
  }

  private _decodeDoubleExponent(double, chunk) {
    switch (chunk[this._cursor]) {
      case ASCII['+']:
        return ++this._cursor === chunk.length ?
          this._continueDecodeDoubleExponent.bind(this, false, double, 0) :
          this._continueDecodeDoubleExponent(false, double, 0, chunk);

      case ASCII['-']:
        return ++this._cursor === chunk.length ?
          this._continueDecodeDoubleExponent.bind(this, true, double, 0) :
          this._continueDecodeDoubleExponent(true, double, 0, chunk);
    }

    return this._continueDecodeDoubleExponent(false, double, 0, chunk);
  }

  private _continueDecodeDoubleExponent(isNegative, double, exponent, chunk) {
    let cursor = this._cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this._cursor = cursor + 2; // skip \r\n
        return double * 10 ** (isNegative ? -exponent : exponent);
      }

      exponent = exponent * 10 + byte - ASCII['0'];
    } while (++cursor < chunk.length);

    this._cursor = cursor;
    return this._continueDecodeDoubleExponent.bind(this, isNegative, double, exponent);
  }

  private _findCRLF(chunk, cursor) {
    while (chunk[cursor] !== ASCII['\r']) {
      if (++cursor === chunk.length) {
        this._cursor = chunk.length;
        return -1;
      }
    }

    this._cursor = cursor + 2; // skip \r\n
    return cursor;
  }

  private _decodeSimpleString(type, chunk) {
    const start = this._cursor,
      crlfIndex = this._findCRLF(chunk, start);
    if (crlfIndex === -1) {
      return this._continueDecodeSimpleString.bind(
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

  private _continueDecodeSimpleString(chunks, type, chunk) {
    const start = this._cursor,
      crlfIndex = this._findCRLF(chunk, start);
    if (crlfIndex === -1) {
      chunks.push(chunk.subarray(start));
      return this._continueDecodeSimpleString.bind(this, chunks, type);
    }

    chunks.push(chunk.subarray(start, crlfIndex));
    return type === Buffer ?
      Buffer.concat(chunks) :
      chunks.join('');
  }

  private _decodeBlobString(type, chunk) {
    // RESP 2 bulk string null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-bulk-strings
    if (chunk[this._cursor] === ASCII['-']) {
      this._cursor += 4; // skip -1\r\n
      return null;
    }

    const length = this._decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this._continueDecodeBlobStringLength.bind(this, length, type);
    } else if (this._cursor >= chunk.length) {
      return this._decodeBlobStringWithLength.bind(this, length, type);
    }

    return this._decodeBlobStringWithLength(length, type, chunk);
  }

  private _continueDecodeBlobStringLength(lengthCb, type, chunk) {
    const length = lengthCb(chunk);
    if (typeof length === 'function') {
      return this._continueDecodeBlobStringLength.bind(this, length, type);
    } else if (this._cursor >= chunk.length) {
      return this._decodeBlobStringWithLength.bind(this, length, type);
    }

    return this._decodeBlobStringWithLength(length, type, chunk);
  }

  private _decodeStringWithLength(length, skip, type, chunk) {
    const end = this._cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this._cursor);
      this._cursor = chunk.length;
      return this._continueDecodeStringWithLength.bind(
        this,
        length - slice.length,
        [slice],
        skip,
        type
      );
    }

    const slice = chunk.subarray(this._cursor, end);
    this._cursor = end + skip;
    return type === Buffer ?
      slice :
      slice.toString();
  }

  private _continueDecodeStringWithLength(length, chunks, skip, type, chunk) {
    const end = this._cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this._cursor);
      chunks.push(slice);
      this._cursor = chunk.length;
      return this._continueDecodeStringWithLength.bind(
        this,
        length - slice.length,
        chunks,
        skip,
        type
      );
    }

    chunks.push(chunk.subarray(this._cursor, end));
    this._cursor = end + skip;
    return type === Buffer ?
      Buffer.concat(chunks) :
      chunks.join('');
  }

  private _decodeBlobStringWithLength(length, type, chunk) {
    return this._decodeStringWithLength(length, 2, type, chunk);
  }

  private _decodeVerbatimString(type, chunk) {
    return this._continueDecodeVerbatimStringLength(
      this._decodeUnsingedNumber.bind(this, 0),
      type,
      chunk
    );
  }

  private _continueDecodeVerbatimStringLength(lengthCb, type, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function'?
      this._continueDecodeVerbatimStringLength.bind(this, length, type) :
      this._decodeVerbatimStringWithLength(length, type, chunk);
  }

  private _decodeVerbatimStringWithLength(length, type, chunk) {
    const stringLength = length - 4; // skip <format>:
    if (type === VerbatimString) {
      return this._decodeVerbatimStringFormat(stringLength, chunk);
    }

    this._cursor += 4; // skip <format>:
    return this._cursor >= chunk.length ?
      this._decodeBlobStringWithLength.bind(this, stringLength, type) :
      this._decodeBlobStringWithLength(stringLength, type, chunk);
  }

  private _decodeVerbatimStringFormat(stringLength, chunk) {
    return this._continueDecodeVerbatimStringFormat(
      stringLength,
      this._decodeStringWithLength.bind(this, 3, 1, String),
      chunk
    );
  }

  private _continueDecodeVerbatimStringFormat(stringLength, formatCb, chunk) {
    const format = formatCb(chunk);
    return typeof format === 'function' ?
      this._continueDecodeVerbatimStringFormat.bind(this, stringLength, format) :
      this._decodeVerbatimStringWithFormat(stringLength, format, chunk);
  }

  private _decodeVerbatimStringWithFormat(stringLength, format, chunk) {
    return this._continueDecodeVerbatimStringWithFormat(
      format,
      this._decodeBlobStringWithLength.bind(this, stringLength, String),
      chunk
    );
  }

  private _continueDecodeVerbatimStringWithFormat(format, stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this._continueDecodeVerbatimStringWithFormat.bind(this, format, string) :
      new VerbatimString(format, string);
  }

  private _decodeSimpleError(chunk) {
    const string = this._decodeSimpleString(String, chunk);
    return typeof string === 'function' ?
      this._continueDecodeSimpleError.bind(this, string) :
      new SimpleError(string);
  }

  private _continueDecodeSimpleError(stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this._continueDecodeSimpleError.bind(this, string) :
      new SimpleError(string);
  }

  private _decodeBlobError(chunk) {
    const string = this._decodeBlobString(String, chunk);
    return typeof string === 'function' ?
      this._continueDecodeBlobError.bind(this, string) :
      new BlobError(string);
  }

  private _continueDecodeBlobError(stringCb, chunk) {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this._continueDecodeBlobError.bind(this, string) :
      new BlobError(string);
  }

  private _decodeNestedType(typeMapping, chunk) {
    const type = chunk[this._cursor];
    return ++this._cursor === chunk.length ?
      this._decodeNestedTypeValue.bind(this, type, typeMapping) :
      this._decodeNestedTypeValue(type, typeMapping, chunk);
  }

  private _decodeNestedTypeValue(type, typeMapping, chunk) {
    switch (type) {
      case RESP_TYPES.NULL:
        return this._decodeNull();

      case RESP_TYPES.BOOLEAN:
        return this._decodeBoolean(chunk);

      case RESP_TYPES.NUMBER:
        return this._decodeNumber(typeMapping[RESP_TYPES.NUMBER], chunk);

      case RESP_TYPES.BIG_NUMBER:
        return this._decodeBigNumber(typeMapping[RESP_TYPES.BIG_NUMBER], chunk);
      
      case RESP_TYPES.DOUBLE:
        return this._decodeDouble(typeMapping[RESP_TYPES.DOUBLE], chunk);
      
      case RESP_TYPES.SIMPLE_STRING:
        return this._decodeSimpleString(typeMapping[RESP_TYPES.SIMPLE_STRING], chunk);
      
      case RESP_TYPES.BLOB_STRING:
        return this._decodeBlobString(typeMapping[RESP_TYPES.BLOB_STRING], chunk);

      case RESP_TYPES.VERBATIM_STRING:
        return this._decodeVerbatimString(typeMapping[RESP_TYPES.VERBATIM_STRING], chunk);

      case RESP_TYPES.SIMPLE_ERROR:
        return this._decodeSimpleError(chunk);
      
      case RESP_TYPES.BLOB_ERROR:
        return this._decodeBlobError(chunk);

      case RESP_TYPES.ARRAY:
        return this._decodeArray(typeMapping, chunk);

      case RESP_TYPES.SET:
        return this._decodeSet(typeMapping, chunk);
      
      case RESP_TYPES.MAP:
        return this._decodeMap(typeMapping, chunk);

      default:
        throw new Error(`Unknown RESP type ${type} "${String.fromCharCode(type)}"`);
    }
  }

  private _decodeArray(typeMapping, chunk) {
    // RESP 2 null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-arrays
    if (chunk[this._cursor] === ASCII['-']) {
      this._cursor += 4; // skip -1\r\n
      return null;
    }

    return this._decodeArrayWithLength(
      this._decodeUnsingedNumber(0, chunk),
      typeMapping,
      chunk
    );
  }

  private _decodeArrayWithLength(length, typeMapping, chunk) {
    return typeof length === 'function' ?
      this._continueDecodeArrayLength.bind(this, length, typeMapping) :
      this._decodeArrayItems(
        new Array(length),
        0,
        typeMapping,
        chunk
      );
  }

  private _continueDecodeArrayLength(lengthCb, typeMapping, chunk) {
    return this._decodeArrayWithLength(
      lengthCb(chunk),
      typeMapping,
      chunk
    );
  }

  private _decodeArrayItems(array, filled, typeMapping, chunk) {
    for (let i = filled; i < array.length; i++) {
      if (this._cursor >= chunk.length) {
        return this._decodeArrayItems.bind(
          this,
          array,
          i,
          typeMapping
        );
      }

      const item = this._decodeNestedType(typeMapping, chunk);
      if (typeof item === 'function') {
        return this._continueDecodeArrayItems.bind(
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

  private _continueDecodeArrayItems(array, filled, itemCb, typeMapping, chunk) {
    const item = itemCb(chunk);
    if (typeof item === 'function') {
      return this._continueDecodeArrayItems.bind(
        this,
        array,
        filled,
        item,
        typeMapping
      );
    }

    array[filled++] = item;

    return this._decodeArrayItems(array, filled, typeMapping, chunk);
  }

  private _decodeSet(typeMapping, chunk) {
    const length = this._decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this._continueDecodeSetLength.bind(this, length, typeMapping);
    }

    return this._decodeSetItems(
      length,
      typeMapping,
      chunk
    );
  }

  private _continueDecodeSetLength(lengthCb, typeMapping, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this._continueDecodeSetLength.bind(this, length, typeMapping) :
      this._decodeSetItems(length, typeMapping, chunk);
  }

  private _decodeSetItems(length, typeMapping, chunk) {
    return typeMapping[RESP_TYPES.SET] === Set ?
      this._decodeSetAsSet(
        new Set(),
        length,
        typeMapping,
        chunk
      ) :
      this._decodeArrayItems(
        new Array(length),
        0,
        typeMapping,
        chunk
      );
  }

  private _decodeSetAsSet(set, remaining, typeMapping, chunk) {
    // using `remaining` instead of `length` & `set.size` to make it work even if the set contains duplicates
    while (remaining > 0) {
      if (this._cursor >= chunk.length) {
        return this._decodeSetAsSet.bind(
          this,
          set,
          remaining,
          typeMapping
        );
      }

      const item = this._decodeNestedType(typeMapping, chunk);
      if (typeof item === 'function') {
        return this._continueDecodeSetAsSet.bind(
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

  private _continueDecodeSetAsSet(set, remaining, itemCb, typeMapping, chunk) {
    const item = itemCb(chunk);
    if (typeof item === 'function') {
      return this._continueDecodeSetAsSet.bind(
        this,
        set,
        remaining,
        item,
        typeMapping
      );
    }

    set.add(item);

    return this._decodeSetAsSet(set, remaining - 1, typeMapping, chunk);
  }

  private _decodeMap(typeMapping, chunk) {
    const length = this._decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return this._continueDecodeMapLength.bind(this, length, typeMapping);
    }

    return this._decodeMapItems(
      length,
      typeMapping,
      chunk
    );
  }

  private _continueDecodeMapLength(lengthCb, typeMapping, chunk) {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this._continueDecodeMapLength.bind(this, length, typeMapping) :
      this._decodeMapItems(length, typeMapping, chunk);
  }

  private _decodeMapItems(length, typeMapping, chunk) {
    switch (typeMapping[RESP_TYPES.MAP]) {
      case Map:
        return this._decodeMapAsMap(
          new Map(),
          length,
          typeMapping,
          chunk
        );

      case Array:
        return this._decodeArrayItems(
          new Array(length * 2),
          0,
          typeMapping,
          chunk
        );

      default:
        return this._decodeMapAsObject(
          Object.create(null),
          length,
          typeMapping,
          chunk
        );
    }
  }

  private _decodeMapAsMap(map, remaining, typeMapping, chunk) {
    // using `remaining` instead of `length` & `map.size` to make it work even if the map contains duplicate keys
    while (remaining > 0) {
      if (this._cursor >= chunk.length) {
        return this._decodeMapAsMap.bind(
          this,
          map,
          remaining,
          typeMapping
        );
      }

      const key = this._decodeMapKey(typeMapping, chunk);
      if (typeof key === 'function') {
        return this._continueDecodeMapKey.bind(
          this,
          map,
          remaining,
          key,
          typeMapping
        );
      }

      if (this._cursor >= chunk.length) {
        return this._continueDecodeMapValue.bind(
          this,
          map,
          remaining,
          key,
          this._decodeNestedType.bind(this, typeMapping),
          typeMapping
        );
      }

      const value = this._decodeNestedType(typeMapping, chunk);
      if (typeof value === 'function') {
        return this._continueDecodeMapValue.bind(
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

  private _decodeMapKey(typeMapping, chunk) {
    const type = chunk[this._cursor];
    return ++this._cursor === chunk.length ?
      this._decodeMapKeyValue.bind(this, type, typeMapping) :
      this._decodeMapKeyValue(type, typeMapping, chunk);
  }

  private _decodeMapKeyValue(type, typeMapping, chunk) {
    switch (type) {
      // decode simple string map key as string (and not as buffer)
      case RESP_TYPES.SIMPLE_STRING:
        return this._decodeSimpleString(String, chunk);
      
      // decode blob string map key as string (and not as buffer)
      case RESP_TYPES.BLOB_STRING:
        return this._decodeBlobString(String, chunk);

      default:
        return this._decodeNestedTypeValue(type, typeMapping, chunk);
    }
  }

  private _continueDecodeMapKey(map, remaining, keyCb, typeMapping, chunk) {
    const key = keyCb(chunk);
    if (typeof key === 'function') {
      return this._continueDecodeMapKey.bind(
        this,
        map,
        remaining,
        key,
        typeMapping
      );
    }

    if (this._cursor >= chunk.length) {
      return this._continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        this._decodeNestedType.bind(this, typeMapping),
        typeMapping
      );
    }      

    const value = this._decodeNestedType(typeMapping, chunk);
    if (typeof value === 'function') {
      return this._continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    map.set(key, value);
    return this._decodeMapAsMap(map, remaining - 1, typeMapping, chunk);
  }

  private _continueDecodeMapValue(map, remaining, key, valueCb, typeMapping, chunk) {
    const value = valueCb(chunk);
    if (typeof value === 'function') {
      return this._continueDecodeMapValue.bind(
        this,
        map,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    map.set(key, value);

    return this._decodeMapAsMap(map, remaining - 1, typeMapping, chunk);
  }

  private _decodeMapAsObject(object, remaining, typeMapping, chunk) {
    while (remaining > 0) {
      if (this._cursor >= chunk.length) {
        return this._decodeMapAsObject.bind(
          this,
          object,
          remaining,
          typeMapping
        );
      }

      const key = this._decodeMapKey(typeMapping, chunk);
      if (typeof key === 'function') {
        return this._continueDecodeMapAsObjectKey.bind(
          this,
          object,
          remaining,
          key,
          typeMapping
        );
      }

      if (this._cursor >= chunk.length) {
        return this._continueDecodeMapAsObjectValue.bind(
          this,
          object,
          remaining,
          key,
          this._decodeNestedType.bind(this, typeMapping),
          typeMapping
        );
      }

      const value = this._decodeNestedType(typeMapping, chunk);
      if (typeof value === 'function') {
        return this._continueDecodeMapAsObjectValue.bind(
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

  private _continueDecodeMapAsObjectKey(object, remaining, keyCb, typeMapping, chunk) {
    const key = keyCb(chunk);
    if (typeof key === 'function') {
      return this._continueDecodeMapAsObjectKey.bind(
        this,
        object,
        remaining,
        key,
        typeMapping
      );
    }

    if (this._cursor >= chunk.length) {
      return this._continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        this._decodeNestedType.bind(this, typeMapping),
        typeMapping
      );
    }

    const value = this._decodeNestedType(typeMapping, chunk);
    if (typeof value === 'function') {
      return this._continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    object[key] = value;

    return this._decodeMapAsObject(object, remaining - 1, typeMapping, chunk);
  }

  private _continueDecodeMapAsObjectValue(object, remaining, key, valueCb, typeMapping, chunk) {
    const value = valueCb(chunk);
    if (typeof value === 'function') {
      return this._continueDecodeMapAsObjectValue.bind(
        this,
        object,
        remaining,
        key,
        value,
        typeMapping
      );
    }

    object[key] = value;

    return this._decodeMapAsObject(object, remaining - 1, typeMapping, chunk);
  }
}
