import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  /**
   * Constructs the SDIFFSTORE command
   * 
   * @param parser - The command parser
   * @param destination - The destination key to store the result
   * @param keys - One or more set keys to compute the difference from
   * @see https://redis.io/commands/sdiffstore/
   */
  parseCommand(parser: CommandParser, destination: RedisArgument, keys: RedisVariadicArgument) {
    parser.push('SDIFFSTORE');
    parser.pushKey(destination);
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
