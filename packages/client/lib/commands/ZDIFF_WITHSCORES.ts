import { Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZDIFF from './ZDIFF';
import { RedisVariadicArgument, transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZDIFF.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZDIFF.IS_READ_ONLY,
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    ZDIFF.parseCommand(parser, keys);
    parser.push('WITHSCORES');
  },
  transformArguments(...args: Parameters<typeof ZDIFF.transformArguments>) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;
