import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the minimum value from a t-digest sketch
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TDIGEST.MIN');
    parser.pushKey(key);
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
