import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';
import { ArrayReply, Command, BlobStringReply, NullReply, RedisArgument } from '../RESP/types';

export interface HGetExOptions {
  expiration?: {
    type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    value: number;
  } | {
    type: 'PERSIST';
  } | 'PERSIST';
}

export default {
  /**
   * Gets the values of the specified fields in a hash and optionally sets their expiration
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   * @param fields - Fields to get values from
   * @param options - Options for setting expiration
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument,
    options?: HGetExOptions
  ) {
    parser.push('HGETEX');
    parser.pushKey(key);

    if (options?.expiration) {
        if (typeof options.expiration === 'string') {
          parser.push(options.expiration);
        } else if (options.expiration.type === 'PERSIST') {
          parser.push('PERSIST');
        } else {
          parser.push(
            options.expiration.type,
            options.expiration.value.toString()
          );
        }
    }

    parser.push('FIELDS')

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
