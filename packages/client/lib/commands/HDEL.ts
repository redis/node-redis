import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  /**
   * Removes one or more fields from a hash
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   * @param field - Field(s) to remove
   */
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisVariadicArgument) {
    parser.push('HDEL');
    parser.pushKey(key);
    parser.pushVariadic(field);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
