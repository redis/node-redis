import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the TOUCH command to alter the last access time of keys
   *
   * @param parser - The command parser
   * @param key - One or more keys to touch
   * @returns The number of keys that were touched
   * @see https://redis.io/commands/touch/
   */
  parseCommand(parser: CommandParser, key: RedisVariadicArgument) {
    parser.push('TOUCH');
    parser.pushKeys(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
