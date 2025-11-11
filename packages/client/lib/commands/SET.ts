import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export interface SetOptions {
  expiration?: {
    type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    value: number;
  } | {
    type: 'KEEPTTL';
  } | 'KEEPTTL';
  /**
   * @deprecated Use `expiration` { type: 'EX', value: number } instead
   */
  EX?: number;
  /**
   * @deprecated Use `expiration` { type: 'PX', value: number } instead
   */
  PX?: number;
  /**
   * @deprecated Use `expiration` { type: 'EXAT', value: number } instead
   */
  EXAT?: number;
  /**
   * @deprecated Use `expiration` { type: 'PXAT', value: number } instead
   */
  PXAT?: number;
  /**
   * @deprecated Use `expiration` 'KEEPTTL' instead
   */
  KEEPTTL?: boolean;

  /**
   * Condition for setting the key:
   * - `NX` - Set if key does not exist
   * - `XX` - Set if key already exists
   *
   * @experimental
   *
   * - `IFEQ` - Set if current value equals match-value (since 8.4, requires `matchValue`)
   * - `IFNE` - Set if current value does not equal match-value (since 8.4, requires `matchValue`)
   * - `IFDEQ` - Set if current value digest equals match-digest (since 8.4, requires `matchValue`)
   * - `IFDNE` - Set if current value digest does not equal match-digest (since 8.4, requires `matchValue`)
  */
  condition?: 'NX' | 'XX' |  'IFEQ' | 'IFNE' | 'IFDEQ' | 'IFDNE';

  /**
   * Value or digest to compare against. Required when using `IFEQ`, `IFNE`, `IFDEQ`, or `IFDNE` conditions.
  */
  matchValue?: RedisArgument;

  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;

  GET?: boolean;
}

export default {
  /**
   * Constructs the SET command
   *
   * @param parser - The command parser
   * @param key - The key to set
   * @param value - The value to set
   * @param options - Additional options for the SET command
   * @see https://redis.io/commands/set/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument | number, options?: SetOptions) {
    parser.push('SET');
    parser.pushKey(key);
    parser.push(typeof value === 'number' ? value.toString() : value);

    if (options?.expiration) {
      if (typeof options.expiration === 'string') {
        parser.push(options.expiration);
      } else if (options.expiration.type === 'KEEPTTL') {
        parser.push('KEEPTTL');
      } else {
        parser.push(
          options.expiration.type,
          options.expiration.value.toString()
        );
      }
    } else if (options?.EX !== undefined) {
      parser.push('EX', options.EX.toString());
    } else if (options?.PX !== undefined) {
      parser.push('PX', options.PX.toString());
    } else if (options?.EXAT !== undefined) {
      parser.push('EXAT', options.EXAT.toString());
    } else if (options?.PXAT !== undefined) {
      parser.push('PXAT', options.PXAT.toString());
    } else if (options?.KEEPTTL) {
      parser.push('KEEPTTL');
    }

    if (options?.condition) {
      parser.push(options.condition);
      if (options?.matchValue !== undefined) {
        parser.push(options.matchValue);
      }
    } else if (options?.NX) {
      parser.push('NX');
    } else if (options?.XX) {
      parser.push('XX');
    }

    if (options?.GET) {
      parser.push('GET');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply | NullReply
} as const satisfies Command;
