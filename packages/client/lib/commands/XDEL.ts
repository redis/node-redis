import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

/**
 * Command for removing messages from a stream
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XDEL command to remove one or more messages from a stream
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param id - One or more message IDs to delete
   * @returns The number of messages actually deleted
   * @see https://redis.io/commands/xdel/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, id: RedisVariadicArgument) {
    parser.push('XDEL');
    parser.pushKey(key);
    parser.pushVariadic(id);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
