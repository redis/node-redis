import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the PFCOUNT command
   * 
   * @param parser - The command parser
   * @param keys - One or more keys of HyperLogLog structures to count
   * @see https://redis.io/commands/pfcount/
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('PFCOUNT');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
