import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the SINTERSTORE command
   * 
   * @param parser - The command parser
   * @param destination - The destination key to store the result
   * @param keys - One or more set keys to compute the intersection from
   * @see https://redis.io/commands/sinterstore/
   */
  parseCommand(parser: CommandParser, destination: RedisArgument, keys: RedisVariadicArgument) {
    parser.push('SINTERSTORE');
    parser.pushKey(destination)
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
