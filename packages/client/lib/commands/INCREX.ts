import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesReply, NumberReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export interface IncrExOptions {
  /**
   * Optional explicit integer increment (default: 1). Pass as `string` to
   * preserve precision past `Number.MAX_SAFE_INTEGER` (Redis integers are
   * 64-bit), e.g. `{ by: '9223372036854775000' }`.
   */
  by?: RedisArgument | number;

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
  parseCommand(parser: CommandParser, key: RedisArgument, options?: IncrExOptions) {
    parser.push('INCREX');
    parser.pushKey(key);

    if (options?.by !== undefined) {
      parser.push('BYINT', transformStringDoubleArgument(options.by));
    }

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
  transformReply: undefined as unknown as () => TuplesReply<[NumberReply, NumberReply]>
} as const satisfies Command;
