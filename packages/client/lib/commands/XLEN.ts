import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

/**
 * Command for getting the length of a stream
 */
export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('XLEN');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
