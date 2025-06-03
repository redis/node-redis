import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument, transformPXAT } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export default {
  IS_READ_ONLY: true,
  /**
   * Parses the arguments for the `HPEXPIREAT` command.
   *
   * @param parser - The command parser instance.
   * @param key - The key of the hash.
   * @param fields - The fields to set the expiration for.
   * @param timestamp - The expiration timestamp (Unix timestamp or Date object).
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT').
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('HPEXPIREAT');
    parser.pushKey(key);
    parser.push(transformPXAT(timestamp));

    if (mode) {
      parser.push(mode);
    }

    parser.push('FIELDS')

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<HashExpiration> | NullReply
} as const satisfies Command;
