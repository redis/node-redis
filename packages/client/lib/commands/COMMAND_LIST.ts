import { CommandParser } from '../client/parser';
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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns a list of all commands supported by the Redis server
   * @param parser - The Redis command parser
   * @param options - Options for filtering the command list
   */
  parseCommand(parser: CommandParser, options?: CommandListOptions) {
    parser.push('COMMAND', 'LIST');

    if (options?.FILTERBY) {
      parser.push(
        'FILTERBY',
        options.FILTERBY.type,
        options.FILTERBY.value
      );
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
