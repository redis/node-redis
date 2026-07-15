import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { RedisVariadicArgument, transformSortedSetReply } from './generic-transformers';
import ZDIFF from './ZDIFF';


export default {
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    ZDIFF.parseCommand(parser, keys);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
