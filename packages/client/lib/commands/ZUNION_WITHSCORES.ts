import { Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZUNION from './ZUNION';
import { Tail, transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZUNION.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZUNION.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: Tail<Parameters<typeof ZUNION.parseCommand>>) {
    ZUNION.parseCommand(parser, ...args);
    parser.push('WITHSCORES');
  },
  transformArguments(...args: Parameters<typeof ZUNION['transformArguments']>) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;
