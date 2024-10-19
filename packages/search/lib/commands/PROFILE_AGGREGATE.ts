import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, ReplyUnion } from "@redis/client/lib/RESP/types";
import AGGREGATE, { AggregateRawReply, FtAggregateOptions, parseAggregateOptions } from "./AGGREGATE";
import { ProfileOptions, ProfileRawReply, ProfileReply, transformProfile } from "./PROFILE_SEARCH";

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
      2: (reply: ProfileAggeregateRawReply): ProfileReply => {
        return {
          results: AGGREGATE.transformReply[2](reply[0]),
          profile: transformProfile(reply[1])
        }
      },
      3: undefined as unknown as () => ReplyUnion
    },
    unstableResp3: true
  } as const satisfies Command;

  type ProfileAggeregateRawReply = ProfileRawReply<AggregateRawReply>;