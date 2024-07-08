import { Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZINTER from './ZINTER';
import { Tail, transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZINTER.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZINTER.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: Tail<Parameters<typeof ZINTER.parseCommand>>) {
    ZINTER.parseCommand(parser, ...args);
    parser.push('WITHSCORES');
  },
  transformArguments(...args: Parameters<typeof ZINTER.transformArguments>) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;
