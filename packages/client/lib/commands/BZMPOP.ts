import { Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZMPOP, { ZMPopArguments } from './ZMPOP';

export default {
  FIRST_KEY_INDEX: 3,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, timeout: number, ...args: ZMPopArguments) {
    parser.pushVariadic(['BZMPOP', timeout.toString()]);
    parser.pushKeysLength(args[0]);
    parser.push(args[1]);
    if (args[2]?.COUNT) {
      parser.pushVariadic(['COUNT', args[2].COUNT.toString()]);
    }
  },
  transformArguments(timeout: number, ...args: ZMPopArguments) { return [] },
  transformReply: ZMPOP.transformReply
} as const satisfies Command;
