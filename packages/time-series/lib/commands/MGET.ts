import { CommandArguments, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export interface TsMGetOptions {
  LATEST?: boolean;
}

export function pushLatestArgument(args: CommandArguments, latest?: boolean) {
  if (latest) {
    args.push('LATEST');
  }

  return args;
}

export function pushFilterArgument(args: CommandArguments, filter: RedisVariadicArgument) {
  args.push('FILTER');
  return pushVariadicArguments(args, filter);
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetOptions) {
    const args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    return pushFilterArgument(args, filter);
  },
  // TODO
  // transformSampleReply
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
