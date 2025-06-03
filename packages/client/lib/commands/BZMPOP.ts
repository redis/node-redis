import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import ZMPOP, { parseZMPopArguments, ZMPopArguments } from './ZMPOP';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns members from one or more sorted sets in the specified order; blocks until elements are available
   * @param parser - The Redis command parser
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   * @param args - Additional arguments specifying the keys, min/max count, and order (MIN/MAX)
   */
  parseCommand(parser: CommandParser, timeout: number, ...args: ZMPopArguments) {
    parser.push('BZMPOP', timeout.toString());
    parseZMPopArguments(parser, ...args);
  },
  transformReply: ZMPOP.transformReply
} as const satisfies Command;
