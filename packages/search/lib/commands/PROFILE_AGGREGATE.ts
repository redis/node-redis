// import { pushAggregatehOptions, AggregateOptions, transformReply as transformAggregateReply, AggregateRawReply } from './AGGREGATE';
// import { ProfileOptions, ProfileRawReply, ProfileReply, transformProfile } from '.';

import { Command, ReplyUnion } from "@redis/client/dist/lib/RESP/types";
import AGGREGATE, { AggregateRawReply, FtAggregateOptions, pushAggregateOptions } from "./AGGREGATE";
import { ProfileOptions, ProfileRawReply, ProfileReply, transformProfile } from "./PROFILE_SEARCH";

export default {
    FIRST_KEY_INDEX: undefined,
    IS_READ_ONLY: true,
    transformArguments(
      index: string,
      query: string,
      options?: ProfileOptions & FtAggregateOptions
    ) {
      const args = ['FT.PROFILE', index, 'AGGREGATE'];
    
      if (options?.LIMITED) {
        args.push('LIMITED');
      }
    
      args.push('QUERY', query);

      return pushAggregateOptions(args, options)
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
    unstableResp3SearchModule: true
  } as const satisfies Command;

  type ProfileAggeregateRawReply = ProfileRawReply<AggregateRawReply>;