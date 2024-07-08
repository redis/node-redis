import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

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
  parseCommand(parser: CommandParser, options?: CommandListOptions) {
    parser.pushVariadic(['COMMAND', 'LIST']);

    if (options?.FILTERBY) {
      parser.pushVariadic(
        [
          'FILTERBY',
          options.FILTERBY.type,
          options.FILTERBY.value
        ]
      );
    }
  },
  transformArguments(options?: CommandListOptions) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
