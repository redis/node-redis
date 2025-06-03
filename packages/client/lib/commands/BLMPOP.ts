import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import LMPOP, { LMPopArguments, parseLMPopArguments } from './LMPOP';

export default {
  IS_READ_ONLY: false,
  /**
   * Pops elements from multiple lists; blocks until elements are available
   * @param parser - The Redis command parser
   * @param timeout - Timeout in seconds, 0 to block indefinitely
   * @param args - Additional arguments for LMPOP command
   */
  parseCommand(parser: CommandParser, timeout: number, ...args: LMPopArguments) {
    parser.push('BLMPOP', timeout.toString());
    parseLMPopArguments(parser, ...args);
  }, 
  transformReply: LMPOP.transformReply
} as const satisfies Command;
