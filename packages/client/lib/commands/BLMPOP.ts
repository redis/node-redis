import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import LMPOP, { LMPopArguments, parseLMPopArguments } from './LMPOP';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, timeout: number, ...args: LMPopArguments) {
    parser.push('BLMPOP', timeout.toString());
    parseLMPopArguments(parser, ...args);
  }, 
  transformReply: LMPOP.transformReply
} as const satisfies Command;
