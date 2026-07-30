import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, Command, RedisArgument, ReplyUnion, TuplesReply, TypeMapping, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
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

function transformProfileSearchReplyResp3(
  reply: ReplyUnion,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
  preserve?: any,
  typeMapping?: TypeMapping
): ProfileReplyResp2 {
  return {
    results: SEARCH.transformReply[3](
      extractProfileResultsReply(reply),
      preserve,
      typeMapping
    ),
    profile: transformProfileReply(reply)
  };
}

export default {
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
    2: (
      reply: UnwrapReply<ProfileSearchResponseResp2>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
      preserve?: any,
      typeMapping?: TypeMapping
    ): ProfileReplyResp2 => {
      return {
        results: SEARCH.transformReply[2](reply[0], preserve, typeMapping),
        profile: reply[1]
      };
    },
    3: transformProfileSearchReplyResp3
  },
} as const satisfies Command;
