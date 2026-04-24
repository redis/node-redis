import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { MSetArguments, parseMSetArguments } from './MSET';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, toSet: MSetArguments) {
    parser.push('MSETNX');
    return parseMSetArguments(parser, toSet);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
