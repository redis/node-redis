import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, BlobStringReply, NullReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, parseLatestArgument, parseFilterArgument } from './MGET';
import { parseSelectedLabelsArguments } from './helpers';
import { createTransformMGetLabelsReply } from './MGET_WITHLABELS';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, filter: RedisVariadicArgument, selectedLabels: RedisVariadicArgument, options?: TsMGetOptions) {
    parser.push('TS.MGET');
    parseLatestArgument(parser, options?.LATEST);
    parseSelectedLabelsArguments(parser, selectedLabels);
    parseFilterArgument(parser, filter);
  },
  transformReply: createTransformMGetLabelsReply<BlobStringReply | NullReply>(),
} as const satisfies Command;
