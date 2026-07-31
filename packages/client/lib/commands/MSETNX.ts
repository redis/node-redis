import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { MSetArguments, parseMSetArguments } from './MSET';

export default {
  parseCommand(parser: CommandParser, toSet: MSetArguments) {
    parser.push('MSETNX');
    return parseMSetArguments(parser, toSet);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
