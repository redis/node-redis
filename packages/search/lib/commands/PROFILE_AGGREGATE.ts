import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ReplyUnion, Resp2Reply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE, { AggregateRawReply, FtAggregateOptions, parseAggregateOptions } from './AGGREGATE';
import { ProfileOptions, ProfileRawReply, ProfileReply, } from './PROFILE_SEARCH';
export interface TransformReplyType {
  2: (reply: UnwrapReply<Resp2Reply<ProfileRawReply<AggregateRawReply>>>) => ProfileReply;
  3: () => ReplyUnion;
}
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    index: string,
    query: string,
    options?: ProfileOptions & FtAggregateOptions
  ) {
    parser.push('FT.PROFILE', index, 'AGGREGATE');

    if (options?.LIMITED) {
      parser.push('LIMITED');
    }

    parser.push('QUERY', query);

    parseAggregateOptions(parser, options)
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<ProfileRawReply<AggregateRawReply>>>): ProfileReply => {
      return {
        results: AGGREGATE.transformReply[2](reply[0]),
        profile: reply[1]
      }
    },
    3: undefined as unknown as () => ReplyUnion
  } as TransformReplyType,
  unstableResp3: true
} as const satisfies Command;
