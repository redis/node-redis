import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, RedisArgument, ReplyUnion } from "@redis/client/lib/RESP/types";
import { AggregateReply } from "./AGGREGATE";
import SEARCH, { FtSearchOptions, SearchRawReply, SearchReply, parseSearchOptions } from "./SEARCH";

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
  warning: string,
  iteratorsProfile: IteratorsProfile
}

export function transformProfile(reply: Array<any>): ProfileData{
  return {
    totalProfileTime: reply[0][1],
    parsingTime: reply[1][1],
    pipelineCreationTime: reply[2][1],
    warning: reply[3][1] ? reply[3][1] : 'None',
    iteratorsProfile: transformIterators(reply[4][1])
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