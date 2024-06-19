import { Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import LMPOP, { LMPopArguments, parseLMPopArguments } from './LMPOP';

export default {
  FIRST_KEY_INDEX: 3,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, timeout: number, ...args: LMPopArguments) {
    parser.pushVariadic(['BLMPOP', timeout.toString()]);
    parseLMPopArguments(parser, ...args);
  }, 
  transformArguments(
    timeout: number,
    ...args: LMPopArguments
  ) { return [] },
  transformReply: LMPOP.transformReply
} as const satisfies Command;
