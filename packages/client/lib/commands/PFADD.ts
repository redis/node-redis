import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the PFADD command
   * 
   * @param parser - The command parser
   * @param key - The key of the HyperLogLog
   * @param element - Optional elements to add
   * @see https://redis.io/commands/pfadd/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, element?: RedisVariadicArgument) {
    parser.push('PFADD')
    parser.pushKey(key);
    if (element) {
      parser.pushVariadic(element);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
