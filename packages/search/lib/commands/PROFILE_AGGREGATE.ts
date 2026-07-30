import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ReplyUnion, TypeMapping, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE, { AggregateRawReply, FtAggregateOptions, parseAggregateOptions } from './AGGREGATE';
import {
  ProfileOptions,
  ProfileRawReplyResp2,
  ProfileReplyResp2,
  extractProfileResultsReply,
  transformProfileReply
} from './PROFILE_SEARCH';

export default {
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
    2: (
      reply: UnwrapReply<ProfileRawReplyResp2<AggregateRawReply>>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
      preserve?: any,
      typeMapping?: TypeMapping
    ): ProfileReplyResp2 => {
      return {
        results: AGGREGATE.transformReply[2](reply[0], preserve, typeMapping),
        profile: reply[1]
      }
    },
    3: (
      reply: ReplyUnion,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
      preserve?: any,
      typeMapping?: TypeMapping
    ): ProfileReplyResp2 => {
      return {
        results: AGGREGATE.transformReply[3](
          extractProfileResultsReply(reply),
          preserve,
          typeMapping
        ),
        profile: transformProfileReply(reply)
      };
    }
  },
} as const satisfies Command;
