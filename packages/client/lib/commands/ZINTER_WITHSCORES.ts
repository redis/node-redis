import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { Tail, transformSortedSetReply } from './generic-transformers';
import ZINTER from './ZINTER';


export default {
  IS_READ_ONLY: ZINTER.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: Tail<Parameters<typeof ZINTER.parseCommand>>) {
    ZINTER.parseCommand(parser, ...args);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
