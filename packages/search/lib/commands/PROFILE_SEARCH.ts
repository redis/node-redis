import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, Command, RedisArgument, ReplyUnion, TuplesReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { AggregateReply } from './AGGREGATE';
import SEARCH, { FtSearchOptions, SearchRawReply, SearchReply, parseSearchOptions } from './SEARCH';

export type ProfileRawReplyResp2<T> = TuplesReply<[
  T,
  ArrayReply<ReplyUnion>
]>;

type ProfileSearchResponseResp2 = ProfileRawReplyResp2<SearchRawReply>;

export interface ProfileReplyResp2 {
  results: SearchReply | AggregateReply;
  profile: ReplyUnion;
}

export interface ProfileOptions {
  LIMITED?: true;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Profiles the execution of a search query for performance analysis.
   * @param parser - The command parser
   * @param index - Name of the index to profile query against
   * @param query - The search query to profile
   * @param options - Optional parameters:
   *   - LIMITED: Collect limited timing information only
   *   - All options supported by FT.SEARCH command
   */
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
    2: (reply: UnwrapReply<ProfileSearchResponseResp2>): ProfileReplyResp2 => {
      return {
        results: SEARCH.transformReply[2](reply[0]),
        profile: reply[1]
      };
    },
    3: (reply: ReplyUnion): ReplyUnion => reply
  },
  unstableResp3: true
} as const satisfies Command;
