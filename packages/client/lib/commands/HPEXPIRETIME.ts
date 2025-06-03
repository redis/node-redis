import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HPEXPIRETIME command
   * 
   * @param parser - The command parser
   * @param key - The key to retrieve expiration time for
   * @param fields - The fields to retrieve expiration time for
   * @see https://redis.io/commands/hpexpiretime/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument,
  ) {
    parser.push('HPEXPIRETIME');
    parser.pushKey(key);
    parser.push('FIELDS');
    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply> | NullReply
} as const satisfies Command;
