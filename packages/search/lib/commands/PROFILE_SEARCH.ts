// import { SearchOptions, SearchRawReply, transformReply as transformSearchReply } from './SEARCH';
// import { pushSearchOptions, ProfileOptions, ProfileRawReply, ProfileReply, transformProfile } from '.';
// import { RedisCommandArguments } from '@redis/client/dist/lib/commands';

import { Command, RedisArgument, ReplyUnion } from "@redis/client/dist/lib/RESP/types";
import SEARCH, { FtSearchOptions, SearchRawReply, SearchReply, pushSearchOptions } from "./SEARCH";
import { AggregateReply } from "./AGGREGATE";

export type ProfileRawReply<T> = [
  results: T,
  profile: [
    _: string,
    TotalProfileTime: string,
    _: string,
    ParsingTime: string,
    _: string,
    PipelineCreationTime: string,
    _: string,
    IteratorsProfile: Array<any>
  ]
];

type ProfileSearchRawReply = ProfileRawReply<SearchRawReply>;

export interface ProfileOptions {
  LIMITED?: true;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(
    index: RedisArgument,
    query: RedisArgument,
    options?: ProfileOptions & FtSearchOptions
  ) {
    let args: Array<RedisArgument> = ['FT.PROFILE', index, 'SEARCH'];

    if (options?.LIMITED) {
      args.push('LIMITED');
    }

    args.push('QUERY', query);

    return pushSearchOptions(args, options);
  },
  transformReply: {
    2: (reply: ProfileSearchRawReply, withoutDocuments: boolean): ProfileReply => {
      return {
        results: SEARCH.transformReply[2](reply[0]),
        profile: transformProfile(reply[1])
      }
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

export interface ProfileReply {
  results: SearchReply | AggregateReply;
  profile: ProfileData;
}

interface ChildIterator {
  type?: string,
  counter?: number,
  term?: string,
  size?: number,
  time?: string,
  childIterators?: Array<ChildIterator>
}

interface IteratorsProfile {
  type?: string,
  counter?: number,
  queryType?: string,
  time?: string,
  childIterators?: Array<ChildIterator>
}

interface ProfileData {
  totalProfileTime: string,
  parsingTime: string,
  pipelineCreationTime: string,
  iteratorsProfile: IteratorsProfile
}

export function transformProfile(reply: Array<any>): ProfileData{
  return {
    totalProfileTime: reply[0][1],
    parsingTime: reply[1][1],
    pipelineCreationTime: reply[2][1],
    iteratorsProfile: transformIterators(reply[3][1])
  };
}

function transformIterators(IteratorsProfile: Array<any>): IteratorsProfile {
  var res: IteratorsProfile = {};
  for (let i = 0; i < IteratorsProfile.length; i += 2) {
    const value = IteratorsProfile[i+1];
    switch (IteratorsProfile[i]) {
      case 'Type':
        res.type = value;
        break;
      case 'Counter':
        res.counter = value;
        break;
      case 'Time':
        res.time = value;
        break;
      case 'Query type':
        res.queryType = value;
        break;
      case 'Child iterators':
        res.childIterators = value.map(transformChildIterators);
        break;
    }
  }

  return res;
}

function transformChildIterators(IteratorsProfile: Array<any>): ChildIterator {
  var res: ChildIterator = {};
  for (let i = 1; i < IteratorsProfile.length; i += 2) {
    const value = IteratorsProfile[i+1];
    switch (IteratorsProfile[i]) {
      case 'Type':
        res.type = value;
        break;
      case 'Counter':
        res.counter = value;
        break;
      case 'Time':
        res.time = value;
        break;
      case 'Size':
        res.size = value;
        break;
      case 'Term':
        res.term = value;
        break;
      case 'Child iterators':
        res.childIterators = value.map(transformChildIterators);
        break;
    }
  }

  return res;
}