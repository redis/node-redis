import { CommandParser } from '../client/parser';
import { Command, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export type XNackMode = 'SILENT' | 'FAIL' | 'FATAL';
export interface XNackOptions {
  RETRYCOUNT?: number;
  FORCE?: boolean;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XNACK command to negatively acknowledge one or more pending stream entries.
   * Added since Redis 8.8.
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - The consumer group name
   * @param mode - NACK mode: SILENT, FAIL, or FATAL
   * @param id - One or more message IDs to nack
   * @param options - Additional options for retry count and force handling
   * @see https://redis.io/commands/xnack/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    mode: XNackMode,
    id: RedisVariadicArgument,
    options?: XNackOptions
  ) {
    parser.push('XNACK');
    parser.pushKey(key);
    parser.push(group, mode, 'IDS');
    parser.pushVariadicWithLength(id);

    if (options?.RETRYCOUNT !== undefined) {
      parser.push('RETRYCOUNT', options.RETRYCOUNT.toString());
    }

    if (options?.FORCE) {
      parser.push('FORCE');
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
