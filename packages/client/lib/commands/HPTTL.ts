import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HPTTL command
   * 
   * @param parser - The command parser
   * @param key - The key to check time-to-live for
   * @param fields - The fields to check time-to-live for
   * @see https://redis.io/commands/hpttl/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument
  ) {
    parser.push('HPTTL');
    parser.pushKey(key);
    parser.push('FIELDS');
    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply> | NullReply
} as const satisfies Command;
