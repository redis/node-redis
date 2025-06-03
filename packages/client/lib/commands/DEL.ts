import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes the specified keys. A key is ignored if it does not exist
   * @param parser - The Redis command parser
   * @param keys - One or more keys to delete
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('DEL');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
