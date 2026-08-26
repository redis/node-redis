import { CommandParser } from '../client/parser';
import { ArrayReply, TuplesReply, NumberReply, Command } from '../RESP/types';

export type LatencyEventType = (
  'active-defrag-cycle' |
  'aof-fstat' |
  'aof-fsync-always' |
  'aof-stat' |
  'aof-rewrite-diff-write' |
  'aof-rename' |
  'aof-write' |
  'aof-write-active-child' |
  'aof-write-alone' |
  'aof-write-pending-fsync' |
  'command' |
  'expire-cycle' |
  'eviction-cycle' |
  'eviction-del' |
  'eviction-lazyfree' |
  'fast-command' |
  'fork' |
  'rdb-unlink-temp-file' |
  'while-blocked-cron'
);

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, event: LatencyEventType) {
    parser.push('LATENCY', 'HISTORY', event);
  },
  transformReply: undefined as unknown as () => ArrayReply<TuplesReply<[
    timestamp: NumberReply,
    latency: NumberReply
  ]>>
} as const satisfies Command;

