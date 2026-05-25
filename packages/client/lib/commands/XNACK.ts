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
