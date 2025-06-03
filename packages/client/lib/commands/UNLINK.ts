import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the UNLINK command to asynchronously delete one or more keys
   *
   * @param parser - The command parser
   * @param keys - One or more keys to unlink
   * @returns The number of keys that were unlinked
   * @see https://redis.io/commands/unlink/
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('UNLINK');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
