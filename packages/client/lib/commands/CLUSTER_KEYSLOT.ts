import { CommandParser } from '../client/parser';
import { Command, NumberReply, RedisArgument } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the hash slot number for a given key
   * @param parser - The Redis command parser
   * @param key - The key to get the hash slot for
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('CLUSTER', 'KEYSLOT', key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
