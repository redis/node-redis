import { Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import BZPOPMAX, { BZPopArguments } from './BZPOPMAX';

export default {
  FIRST_KEY_INDEX: BZPOPMAX.FIRST_KEY_INDEX,
  IS_READ_ONLY: BZPOPMAX.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: BZPopArguments) {
    parser.push('BZPOPMIN');
    parser.pushKeys(args[0]);
    parser.push(args[1].toString());
  },
  transformArguments(...args: BZPopArguments) { return [] },
  transformReply: BZPOPMAX.transformReply
} as const satisfies Command;

