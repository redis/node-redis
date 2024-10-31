import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface XGroupCreateOptions {
  MKSTREAM?: boolean;
  /**
   * added in 7.0
   */
  ENTRIESREAD?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupCreateOptions
  ) {
    parser.push('XGROUP', 'CREATE');
    parser.pushKey(key);
    parser.push(group, id);

    if (options?.MKSTREAM) {
      parser.push('MKSTREAM');
    }

    if (options?.ENTRIESREAD) {
      parser.push('ENTRIESREAD', options.ENTRIESREAD.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

