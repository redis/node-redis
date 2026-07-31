import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import ZMPOP, { parseZMPopArguments, ZMPopArguments } from './ZMPOP';

export default {
  parseCommand(parser: CommandParser, timeout: number, ...args: ZMPopArguments) {
    parser.push('BZMPOP', timeout.toString());
    parseZMPopArguments(parser, ...args);
  },
  transformReply: ZMPOP.transformReply
} as const satisfies Command;
