import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ReplyUnion, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE, { AggregateRawReply, FtAggregateOptions, parseAggregateOptions } from './AGGREGATE';
import { ProfileOptions, ProfileRawReplyResp2, ProfileReplyResp2, } from './PROFILE_SEARCH';

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
    2: (reply: UnwrapReply<ProfileRawReplyResp2<AggregateRawReply>>): ProfileReplyResp2 => {
      return {
        results: AGGREGATE.transformReply[2](reply[0]),
        profile: reply[1]
      }
    },
    3: (reply: ReplyUnion): ReplyUnion => reply
  },
  unstableResp3: true
} as const satisfies Command;
