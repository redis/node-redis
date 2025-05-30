import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  /**
   * Constructs the SADD command
   * 
   * @param parser - The command parser
   * @param key - The set key to add members to
   * @param members - One or more members to add to the set
   * @see https://redis.io/commands/sadd/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, members: RedisVariadicArgument) {
    parser.push('SADD');
    parser.pushKey(key);
    parser.pushVariadic(members);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
