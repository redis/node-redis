import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, Command, RedisArgument, ReplyUnion, Resp2Reply, TuplesReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { AggregateReply } from './AGGREGATE';
import SEARCH, { FtSearchOptions, SearchRawReply, SearchReply, parseSearchOptions } from './SEARCH';

export type ProfileRawReply<T> = TuplesReply<[
  T,
  ArrayReply<ReplyUnion>
]>;

export interface ProfileReply {
  results: SearchReply | AggregateReply;
  profile: ReplyUnion;
}
export interface TransformReplyType {
  2: (reply: UnwrapReply<Resp2Reply<ProfileRawReply<SearchRawReply>>>) => ProfileReply;
  3: () => ReplyUnion;
}

type ProfileSearchRawReply = ProfileRawReply<SearchRawReply>;

export interface ProfileOptions {
  LIMITED?: true;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    index: RedisArgument,
    query: RedisArgument,
    options?: ProfileOptions & FtSearchOptions
  ) {
    parser.push('FT.PROFILE', index, 'SEARCH');

    if (options?.LIMITED) {
      parser.push('LIMITED');
    }

    parser.push('QUERY', query);

    parseSearchOptions(parser, options);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<ProfileSearchRawReply>>): ProfileReply => {
      return {
        results: SEARCH.transformReply[2](reply[0]),
        profile: reply[1]
      };
    },
    3: undefined as unknown as () => ReplyUnion
  } as TransformReplyType,
  unstableResp3: true
} as const satisfies Command;
