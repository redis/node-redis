// RESP3 specification
// https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md

import BufferComposer from '../RESP/composers/buffer';
import { Composer } from '../RESP/composers/interface';
import StringComposer from '../RESP/composers/string';
import { Flags, Reply, ReplyTypes, TransformReplyType } from './types';
import { NestedDecoderInterface } from './nested-decoders/abstract';

const ASCII = {
  '\r': 13,
  't': 116,
  '0': 48,
  '-': 45,
  '.': 46,
  '?': 63,
  'n': 110,
  'i': 105
};

export const RESP_TYPES = {
  NULL: 95, // _
  BOOLEAN: 35, // #
  NUMBER: 58, // :
  BIG_NUMBER: 40, // (
  DOUBLE: 44, // ,
  SIMPLE_STRING: 43, // +
  BLOB_STRING: 36, // $
  // VERBATIM_STRING: 61, // =
  // SIMPLE_ERROR: 45, // -
  // BLOB_ERROR: 33, // !
  ARRAY: 42,
  MAP: 37, // %
  SET: 126, // ~
  // ATTRIBUTE: 124, // |
  // PUSH: 62 // >
} as const;

type RespTypes = typeof RESP_TYPES[keyof typeof RESP_TYPES];

interface RESP3DecoderConfig {
  onReply(reply: Reply): unknown;
}

type NestedState = NestedDecoderInterface<any>;

// interface NestedState<
//   REMAINING extends number | undefined = number | undefined,
//   REPLY extends NestedDecoderInterface<unknown> = NestedDecoderInterface<unknown>
// > {
//   type?: RespTypes;
//   remaining: REMAINING;
//   reply: REPLY;
// }

// Using TypeScript `private` and not the build-in `#` to avoid __classPrivateFieldGet and __classPrivateFieldSet

export default class RESP3Decoder {
  constructor(private config: RESP3DecoderConfig) {}

  private cursor = 0;

  private type?: RespTypes;

  write(chunk: Buffer, flags: Flags): void {
    while (this.cursor < chunk.length) {
      let reply = this.decode(chunk, flags);
      if (reply !== undefined) {
        this.config.onReply(reply);
      }
    }

    this.cursor -= chunk.length;
  }

  private decode(chunk: Buffer, flags: Flags) {
    // while (this.stack.length) {
    //   if (this.type !== undefined) {
    //     const item = this.decodeType(chunk, this.type, flags);
    //     if (item === undefined) return;

    //     let toPush = item;
    //     do {
    //       toPush = this.stack[this.stack.length - 1].reply.push(item);
    //     } while (toPush);
        
    //   }
      
    //   if (reply !== undefined) {
    //     const toPush = this.stack.pop();
    //     this.stack[this.stack.length].reply.push(reply);
    //   }  
    // }
    if (this.type === undefined) {
      const type = chunk[this.cursor] as RespTypes;
      if (++this.cursor === chunk.length) {
        this.type = type;
        return;
      }
      const reply = this.decodeType(chunk, type, flags);
      if (reply === undefined) {
        this.type = type;
      } else {
        return reply;
      }
    }
    
    const reply = this.decodeType(chunk, this.type, flags);
    if (reply !== undefined) {
      this.type = undefined;
      return reply;
    }
  }

  private decodeType<T extends RespTypes, F extends Flags>(chunk: Buffer, type: T, flags: F) {
    switch (type) {
      case RESP_TYPES.NULL:
        return this.decodeNull();

      case RESP_TYPES.BOOLEAN:
        return this.decodeBoolean(chunk);

      case RESP_TYPES.NUMBER:
        return this.decodeNumber(chunk, flags);

      // case RESP_TYPES.BIG_NUMBER:
      //   return this.decodeBigNumber(chunk);

      case RESP_TYPES.DOUBLE:
        return this.decodeDouble(chunk, flags);

      case RESP_TYPES.SIMPLE_STRING:
        return this.decodeSimpleString(chunk, flags);

      case RESP_TYPES.MAP:
        return this.decodeMap(chunk, flags);
    }
  }

  private decodeNull() {
    this.cursor += 2; // skip CRLF
    return null;
  }

  private decodeBoolean(chunk: Buffer) {
    const reply = chunk[this.cursor + 1] === ASCII.t;
    this.cursor += 3; // skip value and CRLF
    return reply;
  }

  private decodeNumber<F extends Flags>(chunk: Buffer, flags: F) {
    switch (flags[RESP_TYPES.NUMBER]) {
      case Buffer:
        return this.composeString(chunk, this.bufferComposer);

      case String:
        return this.composeString(chunk, this.stringComposer);

      case Number:
      default:
        return this.decodeNumberAsNumber(chunk);
    }
  }

  private isNegativeNumber?: boolean;

  private number = 0;

  private decodeNumberAsNumber(chunk: Buffer) {
    if (this.isNegativeNumber === undefined) {
      this.isNegativeNumber = chunk[this.cursor] === ASCII['-'];
      if (this.isNegativeNumber && ++this.cursor === chunk.length) return;
    }

    do {
      const byte = chunk[this.cursor];
      if (byte === ASCII['\r']) {
        const number = this.isNegativeNumber ? -this.number : this.number;
        this.isNegativeNumber = undefined;
        this.number = 0;
        this.cursor += 2; // skip CRLF
        return number;
      }

      this.number = this.number * 10 + byte - ASCII['0'];
    } while (++this.cursor < chunk.length);
  }

  private isNegativeDouble?: boolean;

  // Precalculated multipliers for decimal points to improve performance
  // "A Number only keeps about 17 decimal places of precision"
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
  private static DOUBLE_DECIMAL_MULTIPLIERS = [
    0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001,
    1e-7, 1e-8, 1e-9, 1e-10, 1e-11, 1e-12,
    1e-13, 1e-14, 1e-15, 1e-16, 1e-17
  ];

  private doubleDecimalIndex?: number;

  private double = 0;

  private decodeDouble(chunk: Buffer, flags: Flags) {
    switch (flags[RESP_TYPES.NUMBER]) {
      case Buffer:
        return this.composeString(chunk, this.bufferComposer);

      case String:
        return this.composeString(chunk, this.stringComposer);

      case Number:
      default:
        return this.decodeDoubleAsNumber(chunk);
    }
  }

  private decodeDoubleAsNumber(chunk: Buffer) {
    if (this.isNegativeDouble === undefined) {
      this.isNegativeDouble = chunk[this.cursor] === ASCII['-'];
      if (this.isNegativeDouble && ++this.cursor === chunk.length) return;
    } else if (this.doubleDecimalIndex !== undefined) {
      return this.decodeDecimalDouble(chunk);
    }

    if (this.double === 0) {
      switch (chunk[this.cursor]) {
        case ASCII.i:
          this.cursor += 3; // skip to CRLF
          return this.returnDouble(Infinity);

        case ASCII.n:
          this.cursor += 3; // skip to CRLF
          return this.returnDouble(NaN);
      }
    }

    do {
      const byte = chunk[this.cursor];
      switch (byte) {
        case ASCII['\r']:
          return this.returnDouble();

        case ASCII['.']:
          this.doubleDecimalIndex = 0;
          if (++this.cursor === chunk.length) return;
          return this.decodeDecimalDouble(chunk);

        default:
          this.double = this.double * 10 + byte - ASCII['0'];
      }
    } while (++this.cursor < chunk.length);
  }

  private returnDouble(value = this.double) {
    const double = this.isNegativeDouble ? -value : value;
    this.isNegativeDouble = undefined;
    this.doubleDecimalIndex = undefined;
    this.double = 0;
    this.cursor += 2; // skip CRLF
    return double;
  }

  private decodeDecimalDouble(chunk: Buffer): number | undefined {
    do {
      const byte = chunk[this.cursor];
      if (byte === ASCII['\r']) {
        return this.returnDouble();
      }

      if (RESP3Decoder.DOUBLE_DECIMAL_MULTIPLIERS.length < this.doubleDecimalIndex!) {
        const multiplier = RESP3Decoder.DOUBLE_DECIMAL_MULTIPLIERS[this.doubleDecimalIndex!++];
        this.double += (byte - ASCII['0']) * multiplier;
      }
    } while (++this.cursor < chunk.length);
  }

  private bufferComposer = new BufferComposer();

  private stringComposer = new StringComposer();

  private decodeSimpleString(chunk: Buffer, flags: Flags) {
    switch (flags[RESP_TYPES.SIMPLE_STRING]) {
      case Buffer:
        return this.composeString(chunk, this.bufferComposer);

      case String:
      default:
        return this.composeString(chunk, this.stringComposer);
    }
  }

  private composeString<T>(chunk: Buffer, composer: Composer<T>): T | undefined {
    for (let i = this.cursor; i < chunk.length; i++) {
      if (chunk[i] === ASCII['\r']) {
        const reply = composer.end(
          chunk.subarray(this.cursor, i)
        );
        this.cursor = i + 2;
        return reply;
      }
    }

    const toWrite = chunk.subarray(this.cursor);
    composer.write(toWrite);
    this.cursor = chunk.length;
  }

  private initializingNested = false;

  private nestedStack: Array<{
    type: RespTypes | undefined,
    size: number,
    value: Reply | undefined
  }> = [];

  private decodeNested(type: RespTypes, chunk: Buffer, flags: Flags, toKeep: number) {
    if (this.nestedStack.length > toKeep) {
      const frame = this.nestedStack[this.nestedStack.length - 1];
      if (frame.type === undefined) {
        frame.type = chunk[this.cursor++] as RespTypes;
        if (this.cursor === chunk.length) return;
      }

      
    }
    if (this.initializingNested || this.nestedStack.length === toKeep) {
      // TODO: https://github.com/redis/redis-specifications/blob/master/protocol/RESP3.md#streamed-aggregated-data-types
      if (chunk[this.cursor] === ASCII['?']) {
        this.cursor += 3; // skip ? and CRLF
        this.nestedStack.push({
          type: undefined,
          size: NaN,
          value: undefined
        });
      }
      const size = this.decodeNumberAsNumber(chunk);
      if (size === undefined) {
        this.initializingNested = true;
        return;
      }

    }  
  }

  // private mapKey?: Reply;

  // private decodeMap(chunk: Buffer, flags: Flags) {
  //   // const isNew = depth >= this.stack.length;
  //   // let state = this.stack[depth];
  //   // if (state?.remaining === undefined) {
  //   //   const size = this.decodeNumberAsNumber(chunk);
  //   //   if (size === undefined) {
  //   //     this.stack.push({
  //   //       type: RESP_TYPES.MAP,
  //   //       remaining: undefined,
  //   //       reply: undefined
  //   //     });
  //   //     return;
  //   //   }
  //   //   if (size === 0) return {};
  //   //   state = {
  //   //     type: RESP_TYPES.MAP,
  //   //     remaining: size,
  //   //     reply: {}
  //   //   };
  //   // } else {
  //   //   state = this.stack[depth];
  //   // }
  //   //   // state = isNew ? this.stack[depth] : {
  //   //   //   type: RESP_TYPES.MAP,
  //   //   //   remaining: undefined,
  //   //   //   reply: undefined
  //   //   // };

  //   switch (flags[RESP_TYPES.MAP]) {
  //     case Object:
  //       return this.decodeMapAsObject(chunk, flags, state, depth); // TODO

  //     case Array:
  //       return; // TODO

  //     case Map:
  //     default:
  //       return; // TODO
  //   }
  // }

  // private decodeMapAsObject(chunk: Buffer, flags: Flags, state: NestedDecoderState, depth: number) {
  //   if (this.mapKey !== undefined) {
  //     const value = this.
  //   }

  //   do {
  //     const key = this.decodeNewItem(chunk, flags);
  //     if (key === undefined) break;
  //     const value = this.decodeNewItem(chunk, flags);
  //     if (value === undefined) break;
  //     state.reply[`${key}`] = value;

  //     if (--state.remaining! === 0) return state.reply;
  //   } while (this.cursor < chunk.length);
  // }

  // private keepNested(chunk: Buffer, flags: Flags) {
  //   const reply = this.decodeType(chunk, this.stack[this.stack.length - 1], flags)
  // }
  

  reset() {
    this.cursor = 0;
    this.type = undefined;
    this.isNegativeNumber = undefined;
    this.number = 0;
    this.isNegativeDouble = undefined;
    this.doubleDecimalIndex = undefined;
    this.double = 0;
    this.bufferComposer.reset();
    this.stringComposer.reset();
    this.initializingNested = false;
    this.nestedStack = [];
  }
}