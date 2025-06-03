import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Determines if the specified keys exist
   * @param parser - The Redis command parser
   * @param keys - One or more keys to check
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('EXISTS');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
