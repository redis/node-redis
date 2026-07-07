import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesReply, BlobStringReply, DoubleReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface IncrExByFloatOptions {
  lowerBound?: RedisArgument | number;
  upperBound?: RedisArgument | number;

  /**
   * Out-of-bounds policy.
   * - `true`  — clamp the result to `lowerBound`/`upperBound` (or to type limits if no explicit bound).
   * - `false` or omitted (default) — the operation is rejected silently: the reply is
   *   `[currentValue, 0]` and the key's value and TTL are left unchanged. An
   *   `actualIncrement` of `0` always indicates a rejected out-of-bounds operation.
   */
  saturate?: boolean;

  expiration?:
    | { type: 'EX' | 'PX' | 'EXAT' | 'PXAT'; value: number; ENX?: boolean }
    | { type: 'PERSIST' };
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    value: RedisArgument | number,
    options?: IncrExByFloatOptions
  ) {
    parser.push('INCREX');
    parser.pushKey(key);
    parser.push('BYFLOAT', transformStringDoubleArgument(value));

    if (options?.lowerBound !== undefined) {
      parser.push('LBOUND', transformStringDoubleArgument(options.lowerBound));
    }

    if (options?.upperBound !== undefined) {
      parser.push('UBOUND', transformStringDoubleArgument(options.upperBound));
    }

    if (options?.saturate) {
      parser.push('SATURATE');
    }

    if (options?.expiration) {
      if (options.expiration.type === 'PERSIST') {
        parser.push('PERSIST');
      } else {
        parser.push(options.expiration.type, options.expiration.value.toString());
        if (options.expiration.ENX) {
          parser.push('ENX');
        }
      }
    }
  },
  transformReply: {
    2: undefined as unknown as () => TuplesReply<[BlobStringReply, BlobStringReply]>,
    3: undefined as unknown as () => TuplesReply<[DoubleReply, DoubleReply]>
  }
} as const satisfies Command;
