import { VerbatimString } from './verbatim-string';
import { SimpleError, BlobError, ErrorReply } from '../errors';
import { TypeMapping } from './types';

// A step that runs out of bytes returns a continuation; calling it with the
// next chunk resumes the step.
type Continuation<T> = (chunk: Buffer) => T | Continuation<T>;

type DecodeStep<T> = T | Continuation<T>;

type DecodedReply =
  | null
  | boolean
  | number
  | bigint
  | string
  | Buffer
  | VerbatimString
  | ErrorReply
  | DecodedArray
  | DecodedSet
  | DecodedMap
  | DecodedObject;

type DecodedArray = Array<DecodedReply>;

type DecodedSet = Set<DecodedReply>;

type DecodedMap = Map<DecodedReply, DecodedReply>;

interface DecodedObject {
  [key: string]: DecodedReply;
}

type StringMapping = TypeMapping[
  | typeof RESP_TYPES.SIMPLE_STRING
  | typeof RESP_TYPES.BLOB_STRING
  | typeof RESP_TYPES.VERBATIM_STRING
];

// The `type` a string helper accepts.
type StringType = StringMapping | StringConstructor | BufferConstructor;

// What a string helper returns for `type`: a string for `String` (or no
// mapping), a Buffer for `Buffer`, either for a mapping only known at runtime.
type StringResult<M extends StringType> =
  M extends StringConstructor | undefined ? string :
  M extends BufferConstructor ? Buffer :
  string | Buffer;

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
  ATTRIBUTE: 124, // |
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
function slowParseDouble(buffer: Buffer, start: number, end: number): number {
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

function noop() {}

// this was written with performance in mind, so it's not very readable... sorry :(

interface DecoderOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- public callback signature
  onReply(reply: any): unknown;
  onErrorReply(err: ErrorReply): unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- public callback signature
  onPush(push: Array<any>): unknown;
  getTypeMapping(): TypeMapping;
}

export class Decoder {
  onReply: DecoderOptions['onReply'];
  onErrorReply: DecoderOptions['onErrorReply'];
  onPush: DecoderOptions['onPush'];
  getTypeMapping: DecoderOptions['getTypeMapping'];
  #cursor = 0;
  #next: ((chunk: Buffer) => boolean) | undefined;
  #callbackErrors?: Array<unknown>;

  constructor(config: DecoderOptions) {
    this.onReply = config.onReply;
    this.onErrorReply = config.onErrorReply;
    this.onPush = config.onPush;
    this.getTypeMapping = config.getTypeMapping;
  }

  reset(): void {
    this.#cursor = 0;
    this.#next = undefined;
  }

  write(chunk: Buffer): Array<unknown> | undefined {
    this.#callbackErrors = undefined;
    this.#write(chunk);
    return this.#callbackErrors;
  }

  #write(chunk: Buffer): void {
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

  #continueDecodeTypeValue(type: number, chunk: Buffer): boolean {
    this.#next = undefined;
    return this.#decodeTypeValue(type, chunk);
  }

  #decodeTypeValue(type: number, chunk: Buffer): boolean {
    switch (type) {
      case RESP_TYPES.NULL:
        return this.#handleDecodedValue(
          this.onReply,
          this.#decodeNull()
        );

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

      // attributes are not exposed, skip them and decode the reply that follows
      case RESP_TYPES.ATTRIBUTE:
        return this.#handleDecodedValue(
          noop,
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

  #handleDecodedValue(cb: DecoderOptions['onReply'], value: DecodeStep<DecodedReply>): boolean {
    if (typeof value === 'function') {
      this.#next = this.#continueDecodeValue.bind(this, cb, value);
      return true;
    }

    try {
      cb(value);
    } catch (err) {
      (this.#callbackErrors ??= []).push(err);
    }
    return false;
  }

  #continueDecodeValue(
    cb: DecoderOptions['onReply'],
    next: Continuation<DecodedReply>,
    chunk: Buffer
  ): boolean {
    this.#next = undefined;
    return this.#handleDecodedValue(cb, next(chunk));
  }

  #decodeNull(): null {
    this.#cursor += 2; // skip \r\n
    return null;
  }

  #decodeBoolean(chunk: Buffer): boolean {
    const boolean = chunk[this.#cursor] === ASCII.t;
    this.#cursor += 3; // skip {t | f}\r\n
    return boolean;
  }

  #decodeNumber(
    type: TypeMapping[typeof RESP_TYPES.NUMBER],
    chunk: Buffer
  ): DecodeStep<number | string | Buffer> {
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

  #maybeDecodeNumberValue(isNegative: boolean, chunk: Buffer): DecodeStep<number> {
    const cb = this.#decodeUnsingedNumber.bind(this, 0);
    return ++this.#cursor === chunk.length ?
      this.#decodeNumberValue.bind(this, isNegative, cb) :
      this.#decodeNumberValue(isNegative, cb, chunk);
  }

  #decodeNumberValue(
    isNegative: boolean,
    numberCb: Continuation<number>,
    chunk: Buffer
  ): DecodeStep<number> {
    const number = numberCb(chunk);
    return typeof number === 'function' ?
      this.#decodeNumberValue.bind(this, isNegative, number) :
      isNegative ? -number : number;
  }

  #decodeUnsingedNumber(number: number, chunk: Buffer): DecodeStep<number> {
    let cursor = this.#cursor;
    do {
      const byte = chunk[cursor];
      if (byte === ASCII['\r']) {
        this.#cursor = cursor + 2; // skip \r\n
        return number;
      }
      number = number * 10 + (byte - ASCII['0']);
    } while (++cursor < chunk.length);

    this.#cursor = cursor;
    return this.#decodeUnsingedNumber.bind(this, number);
  }

  #decodeBigNumber(
    type: TypeMapping[typeof RESP_TYPES.BIG_NUMBER],
    chunk: Buffer
  ): DecodeStep<bigint | string | Buffer> {
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

  #maybeDecodeBigNumberValue(isNegative: boolean, chunk: Buffer): DecodeStep<bigint> {
    const cb = this.#decodeUnsingedBigNumber.bind(this, 0n);
    return ++this.#cursor === chunk.length ?
      this.#decodeBigNumberValue.bind(this, isNegative, cb) :
      this.#decodeBigNumberValue(isNegative, cb, chunk);
  }

  #decodeBigNumberValue(
    isNegative: boolean,
    bigNumberCb: Continuation<bigint>,
    chunk: Buffer
  ): DecodeStep<bigint> {
    const bigNumber = bigNumberCb(chunk);
    return typeof bigNumber === 'function' ?
      this.#decodeBigNumberValue.bind(this, isNegative, bigNumber) :
      isNegative ? -bigNumber : bigNumber;
  }

  #decodeUnsingedBigNumber(bigNumber: bigint, chunk: Buffer): DecodeStep<bigint> {
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

  #decodeDouble(
    type: TypeMapping[typeof RESP_TYPES.DOUBLE],
    chunk: Buffer
  ): DecodeStep<number | string | Buffer> {
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

  #continueDecodeDouble(chunks: Array<Buffer>, chunk: Buffer): DecodeStep<number> {
    const buffer = this.#continueDecodeSimpleString(chunks, Buffer, chunk);
    return typeof buffer === 'function' ?
      this.#continueDecodeDouble.bind(this, chunks) :
      slowParseDouble(buffer, 0, buffer.length);
  }

  #findCRLF(chunk: Buffer, cursor: number): number {
    while (chunk[cursor] !== ASCII['\r']) {
      if (++cursor === chunk.length) {
        this.#cursor = chunk.length;
        return -1;
      }
    }

    this.#cursor = cursor + 2; // skip \r\n
    return cursor;
  }

  #decodeSimpleString<M extends StringType>(type: M, chunk: Buffer): DecodeStep<StringResult<M>> {
    const start = this.#cursor,
      crlfIndex = this.#findCRLF(chunk, start);
    if (crlfIndex === -1) {
      return (this.#continueDecodeSimpleString<M>).bind(
        this,
        [chunk.subarray(start)],
        type
      );
    }

    const slice = chunk.subarray(start, crlfIndex);
    return (type === Buffer ?
      slice :
      slice.toString()) as StringResult<M>;
  }

  #continueDecodeSimpleString<M extends StringType>(
    chunks: Array<Buffer>,
    type: M,
    chunk: Buffer
  ): DecodeStep<StringResult<M>> {
    const start = this.#cursor,
      crlfIndex = this.#findCRLF(chunk, start);
    if (crlfIndex === -1) {
      chunks.push(chunk.subarray(start));
      return (this.#continueDecodeSimpleString<M>).bind(this, chunks, type);
    }

    chunks.push(chunk.subarray(start, crlfIndex));
    const buffer = Buffer.concat(chunks);
    return (type === Buffer ? buffer : buffer.toString()) as StringResult<M>;
  }

  #decodeBlobString<M extends StringType>(type: M, chunk: Buffer): DecodeStep<StringResult<M> | null> {
    // RESP 2 bulk string null
    // https://github.com/redis/redis-specifications/blob/master/protocol/RESP2.md#resp-bulk-strings
    if (chunk[this.#cursor] === ASCII['-']) {
      this.#cursor += 4; // skip -1\r\n
      return null;
    }

    const length = this.#decodeUnsingedNumber(0, chunk);
    if (typeof length === 'function') {
      return (this.#continueDecodeBlobStringLength<M>).bind(this, length, type);
    } else if (this.#cursor >= chunk.length) {
      return (this.#decodeBlobStringWithLength<M>).bind(this, length, type);
    }

    return this.#decodeBlobStringWithLength(length, type, chunk);
  }

  #continueDecodeBlobStringLength<M extends StringType>(
    lengthCb: Continuation<number>,
    type: M,
    chunk: Buffer
  ): DecodeStep<StringResult<M>> {
    const length = lengthCb(chunk);
    if (typeof length === 'function') {
      return (this.#continueDecodeBlobStringLength<M>).bind(this, length, type);
    } else if (this.#cursor >= chunk.length) {
      return (this.#decodeBlobStringWithLength<M>).bind(this, length, type);
    }

    return this.#decodeBlobStringWithLength(length, type, chunk);
  }

  #decodeStringWithLength<M extends StringType>(
    length: number,
    skip: number,
    type: M,
    chunk: Buffer
  ): DecodeStep<StringResult<M>> {
    const end = this.#cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this.#cursor);
      this.#cursor = chunk.length;
      return (this.#continueDecodeStringWithLength<M>).bind(
        this,
        length - slice.length,
        [slice],
        skip,
        type
      );
    }

    const slice = chunk.subarray(this.#cursor, end);
    this.#cursor = end + skip;
    return (type === Buffer ?
      slice :
      slice.toString()) as StringResult<M>;
  }

  #continueDecodeStringWithLength<M extends StringType>(
    length: number,
    chunks: Array<Buffer>,
    skip: number,
    type: M,
    chunk: Buffer
  ): DecodeStep<StringResult<M>> {
    const end = this.#cursor + length;
    if (end >= chunk.length) {
      const slice = chunk.subarray(this.#cursor);
      chunks.push(slice);
      this.#cursor = chunk.length;
      return (this.#continueDecodeStringWithLength<M>).bind(
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
    return (type === Buffer ? buffer : buffer.toString()) as StringResult<M>;
  }

  #decodeBlobStringWithLength<M extends StringType>(
    length: number,
    type: M,
    chunk: Buffer
  ): DecodeStep<StringResult<M>> {
    return this.#decodeStringWithLength(length, 2, type, chunk);
  }

  #decodeVerbatimString(
    type: StringMapping,
    chunk: Buffer
  ): DecodeStep<string | Buffer | VerbatimString> {
    return this.#continueDecodeVerbatimStringLength(
      this.#decodeUnsingedNumber.bind(this, 0),
      type,
      chunk
    );
  }

  #continueDecodeVerbatimStringLength(
    lengthCb: Continuation<number>,
    type: StringMapping,
    chunk: Buffer
  ): DecodeStep<string | Buffer | VerbatimString> {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeVerbatimStringLength.bind(this, length, type) :
      this.#decodeVerbatimStringWithLength(length, type, chunk);
  }

  #decodeVerbatimStringWithLength(
    length: number,
    type: StringMapping,
    chunk: Buffer
  ): DecodeStep<string | Buffer | VerbatimString> {
    const stringLength = length - 4; // skip <format>:
    if (type === VerbatimString) {
      return this.#decodeVerbatimStringFormat(stringLength, chunk);
    }

    this.#cursor += 4; // skip <format>:
    return this.#cursor >= chunk.length ?
      (this.#decodeBlobStringWithLength<StringMapping>).bind(this, stringLength, type) :
      this.#decodeBlobStringWithLength(stringLength, type, chunk);
  }

  #decodeVerbatimStringFormat(stringLength: number, chunk: Buffer): DecodeStep<VerbatimString> {
    const formatCb = (this.#decodeStringWithLength<StringConstructor>).bind(this, 3, 1, String);
    return this.#cursor >= chunk.length ?
      this.#continueDecodeVerbatimStringFormat.bind(this, stringLength, formatCb) :
      this.#continueDecodeVerbatimStringFormat(stringLength, formatCb, chunk);
  }

  #continueDecodeVerbatimStringFormat(
    stringLength: number,
    formatCb: Continuation<string>,
    chunk: Buffer
  ): DecodeStep<VerbatimString> {
    const format = formatCb(chunk);
    return typeof format === 'function' ?
      this.#continueDecodeVerbatimStringFormat.bind(this, stringLength, format) :
      this.#decodeVerbatimStringWithFormat(stringLength, format, chunk);
  }

  #decodeVerbatimStringWithFormat(
    stringLength: number,
    format: string,
    chunk: Buffer
  ): DecodeStep<VerbatimString> {
    return this.#continueDecodeVerbatimStringWithFormat(
      format,
      (this.#decodeBlobStringWithLength<StringConstructor>).bind(this, stringLength, String),
      chunk
    );
  }

  #continueDecodeVerbatimStringWithFormat(
    format: string,
    stringCb: Continuation<string>,
    chunk: Buffer
  ): DecodeStep<VerbatimString> {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeVerbatimStringWithFormat.bind(this, format, string) :
      new VerbatimString(format, string);
  }

  #decodeSimpleError(chunk: Buffer): DecodeStep<SimpleError> {
    const string = this.#decodeSimpleString(String, chunk);
    return typeof string === 'function' ?
      this.#continueDecodeSimpleError.bind(this, string) :
      new SimpleError(string);
  }

  #continueDecodeSimpleError(
    stringCb: Continuation<string>,
    chunk: Buffer
  ): DecodeStep<SimpleError> {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeSimpleError.bind(this, string) :
      new SimpleError(string);
  }

  #decodeBlobError(chunk: Buffer): DecodeStep<BlobError> {
    const string = this.#decodeBlobString(String, chunk);
    return typeof string === 'function' ?
      this.#continueDecodeBlobError.bind(this, string) :
      new BlobError(string as string);
  }

  #continueDecodeBlobError(
    stringCb: Continuation<string | null>,
    chunk: Buffer
  ): DecodeStep<BlobError> {
    const string = stringCb(chunk);
    return typeof string === 'function' ?
      this.#continueDecodeBlobError.bind(this, string) :
      new BlobError(string as string);
  }

  #decodeNestedType(typeMapping: TypeMapping, chunk: Buffer): DecodeStep<DecodedReply> {
    const type = chunk[this.#cursor];
    return ++this.#cursor === chunk.length ?
      this.#decodeNestedTypeValue.bind(this, type, typeMapping) :
      this.#decodeNestedTypeValue(type, typeMapping, chunk);
  }

  #decodeNestedTypeValue(
    type: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedReply> {
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

      case RESP_TYPES.ATTRIBUTE:
        return this.#decodeAttribute(
          this.#decodeMap(typeMapping, chunk),
          this.#decodeNestedType.bind(this, typeMapping),
          chunk
        );

      default:
        throw new Error(`Unknown RESP type ${type} "${String.fromCharCode(type)}"`);
    }
  }

  #decodeAttribute(
    attribute: DecodeStep<DecodedMap | DecodedArray | DecodedObject>,
    decodeNext: Continuation<DecodedReply>,
    chunk: Buffer
  ): DecodeStep<DecodedReply> {
    if (typeof attribute === 'function') {
      return this.#continueDecodeAttribute.bind(this, attribute, decodeNext);
    }

    return this.#cursor >= chunk.length ? decodeNext : decodeNext(chunk);
  }

  #continueDecodeAttribute(
    attributeCb: Continuation<DecodedMap | DecodedArray | DecodedObject>,
    decodeNext: Continuation<DecodedReply>,
    chunk: Buffer
  ): DecodeStep<DecodedReply> {
    return this.#decodeAttribute(attributeCb(chunk), decodeNext, chunk);
  }

  #decodeArray(typeMapping: TypeMapping, chunk: Buffer): DecodeStep<DecodedArray | null> {
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

  #decodeArrayWithLength(
    length: DecodeStep<number>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedArray> {
    return typeof length === 'function' ?
      this.#continueDecodeArrayLength.bind(this, length, typeMapping) :
      this.#decodeArrayItems(
        new Array(length),
        0,
        typeMapping,
        chunk
      );
  }

  #continueDecodeArrayLength(
    lengthCb: Continuation<number>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedArray> {
    return this.#decodeArrayWithLength(
      lengthCb(chunk),
      typeMapping,
      chunk
    );
  }

  #decodeArrayItems(
    array: DecodedArray,
    filled: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedArray> {
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

  #continueDecodeArrayItems(
    array: DecodedArray,
    filled: number,
    itemCb: Continuation<DecodedReply>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedArray> {
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

  #decodeSet(typeMapping: TypeMapping, chunk: Buffer): DecodeStep<DecodedSet | DecodedArray> {
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

  #continueDecodeSetLength(
    lengthCb: Continuation<number>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedSet | DecodedArray> {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeSetLength.bind(this, length, typeMapping) :
      this.#decodeSetItems(length, typeMapping, chunk);
  }

  #decodeSetItems(
    length: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedSet | DecodedArray> {
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

  #decodeSetAsSet(
    set: DecodedSet,
    remaining: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedSet> {
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

  #continueDecodeSetAsSet(
    set: DecodedSet,
    remaining: number,
    itemCb: Continuation<DecodedReply>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedSet> {
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

  #decodeMap(
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedMap | DecodedArray | DecodedObject> {
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

  #continueDecodeMapLength(
    lengthCb: Continuation<number>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedMap | DecodedArray | DecodedObject> {
    const length = lengthCb(chunk);
    return typeof length === 'function' ?
      this.#continueDecodeMapLength.bind(this, length, typeMapping) :
      this.#decodeMapItems(length, typeMapping, chunk);
  }

  #decodeMapItems(
    length: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedMap | DecodedArray | DecodedObject> {
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

  #decodeMapAsMap(
    map: DecodedMap,
    remaining: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedMap> {
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

  #decodeMapKey(typeMapping: TypeMapping, chunk: Buffer): DecodeStep<DecodedReply> {
    const type = chunk[this.#cursor];
    return ++this.#cursor === chunk.length ?
      this.#decodeMapKeyValue.bind(this, type, typeMapping) :
      this.#decodeMapKeyValue(type, typeMapping, chunk);
  }

  #decodeMapKeyValue(
    type: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedReply> {
    switch (type) {
      // decode simple string map key as string (and not as buffer)
      case RESP_TYPES.SIMPLE_STRING:
        return this.#decodeSimpleString(String, chunk);

      // decode blob string map key as string (and not as buffer)
      case RESP_TYPES.BLOB_STRING:
        return this.#decodeBlobString(String, chunk);

      // skip the attribute and decode the key that follows as a map key
      case RESP_TYPES.ATTRIBUTE:
        return this.#decodeAttribute(
          this.#decodeMap(typeMapping, chunk),
          this.#decodeMapKey.bind(this, typeMapping),
          chunk
        );

      default:
        return this.#decodeNestedTypeValue(type, typeMapping, chunk);
    }
  }

  #continueDecodeMapKey(
    map: DecodedMap,
    remaining: number,
    keyCb: Continuation<DecodedReply>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedMap> {
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

  #continueDecodeMapValue(
    map: DecodedMap,
    remaining: number,
    key: DecodedReply,
    valueCb: Continuation<DecodedReply>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedMap> {
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

  #decodeMapAsObject(
    object: DecodedObject,
    remaining: number,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedObject> {
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

      object[key as string] = value;
      --remaining;
    }

    return object;
  }

  #continueDecodeMapAsObjectKey(
    object: DecodedObject,
    remaining: number,
    keyCb: Continuation<DecodedReply>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedObject> {
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

    object[key as string] = value;

    return this.#decodeMapAsObject(object, remaining - 1, typeMapping, chunk);
  }

  #continueDecodeMapAsObjectValue(
    object: DecodedObject,
    remaining: number,
    key: DecodedReply,
    valueCb: Continuation<DecodedReply>,
    typeMapping: TypeMapping,
    chunk: Buffer
  ): DecodeStep<DecodedObject> {
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

    object[key as string] = value;

    return this.#decodeMapAsObject(object, remaining - 1, typeMapping, chunk);
  }
}
