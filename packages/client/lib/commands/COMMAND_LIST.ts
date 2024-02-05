import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export const COMMAND_LIST_FILTER_BY = {
  MODULE: 'MODULE',
  ACLCAT: 'ACLCAT',
  PATTERN: 'PATTERN'
} as const;

export type CommandListFilterBy = typeof COMMAND_LIST_FILTER_BY[keyof typeof COMMAND_LIST_FILTER_BY];

export interface CommandListOptions {
  FILTERBY?: {
    type: CommandListFilterBy;
    value: RedisArgument;
  };
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(options?: CommandListOptions) {
    const args: Array<RedisArgument> = ['COMMAND', 'LIST'];

    if (options?.FILTERBY) {
      args.push(
        'FILTERBY',
        options.FILTERBY.type,
        options.FILTERBY.value
      );
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
