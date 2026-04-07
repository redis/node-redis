import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, Command, RedisArgument, ReplyUnion, TuplesReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { AggregateReply } from './AGGREGATE';
import SEARCH, { FtSearchOptions, SearchRawReply, SearchReply, parseSearchOptions } from './SEARCH';
import { getMapValue, mapLikeEntries, mapLikeToObject, normalizeProfileReply } from './reply-transformers';

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

export function extractProfileResultsReply(reply: ReplyUnion): ReplyUnion {
  const replyObject = mapLikeToObject(reply);

  // Redis 8+ wraps results under `Results`.
  if (Object.hasOwn(replyObject, 'Results')) {
    return replyObject['Results'] as ReplyUnion;
  }

  // Redis 7.4 RESP3 returns search/aggregate payload directly at top-level.
  if (
    (Object.hasOwn(replyObject, 'total_results') || Object.hasOwn(replyObject, 'total')) &&
    Object.hasOwn(replyObject, 'results')
  ) {
    return reply;
  }

  if (Object.hasOwn(replyObject, 'results')) {
    return replyObject['results'] as ReplyUnion;
  }

  return (getMapValue(replyObject, ['results']) ?? reply) as ReplyUnion;
}

function normalizeLegacyProfileReply(profile: ReplyUnion): ReplyUnion {
  return mapLikeEntries(profile).map(([key, value]) => {
    // Redis 7.4 often wraps iterator profiles as a single-element array containing an object.
    // Tests expect the inner object normalized directly as a flat key/value list.
    if (Array.isArray(value) && value.length === 1) {
      const first = value[0];
      if (Object.keys(mapLikeToObject(first)).length > 0) {
        return [key, normalizeProfileReply(first)];
      }
    }

    return [key, normalizeProfileReply(value)];
  }) as unknown as ReplyUnion;
}

export function transformProfileReply(reply: ReplyUnion): ReplyUnion {
  const replyObject = mapLikeToObject(reply);
  const profile = (
    Object.hasOwn(replyObject, 'Profile') ?
      replyObject['Profile'] :
      Object.hasOwn(replyObject, 'profile') ?
        replyObject['profile'] :
        getMapValue(replyObject, ['Profile', 'profile'])
  ) as ReplyUnion;

  const profileObject = mapLikeToObject(profile);

  // Redis 7.2 - 7.4 profile payload is a plain map keyed by timing labels.
  if (Object.hasOwn(profileObject, 'Total profile time')) {
    return normalizeLegacyProfileReply(profile);
  }

  return normalizeProfileReply(profile) as ReplyUnion;
}

function transformProfileSearchReplyResp3(reply: ReplyUnion): ProfileReplyResp2 {
  return {
    results: SEARCH.transformReply[3](
      extractProfileResultsReply(reply)
    ),
    profile: transformProfileReply(reply)
  };
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
    3: transformProfileSearchReplyResp3
  },
} as const satisfies Command;
