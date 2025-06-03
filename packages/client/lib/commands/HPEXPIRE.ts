import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export default {
  /**
   * Parses the arguments for the `HPEXPIRE` command.
   *
   * @param parser - The command parser instance.
   * @param key - The key of the hash.
   * @param fields - The fields to set the expiration for.
   * @param ms - The expiration time in milliseconds.
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT').
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument, 
    fields: RedisVariadicArgument,
    ms: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT',
  ) {
    parser.push('HPEXPIRE');
    parser.pushKey(key);
    parser.push(ms.toString());

    if (mode) {
      parser.push(mode);
    }

    parser.push('FIELDS')

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<HashExpiration> | NullReply
} as const satisfies Command;
