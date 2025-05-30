import { CommandParser } from '../client/parser';
import { RedisArgument, Command, NumberReply } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HSETNX command
   * 
   * @param parser - The command parser
   * @param key - The key of the hash
   * @param field - The field to set if it does not exist
   * @param value - The value to set
   * @see https://redis.io/commands/hsetnx/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    value: RedisArgument
  ) {
    parser.push('HSETNX');
    parser.pushKey(key);
    parser.push(field, value);
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
