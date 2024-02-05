import { ArrayReply, TuplesReply, NumberReply, Command } from '../RESP/types';

export type LatencyEventType = (
  'active-defrag-cycle' |
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
  'fast-command' |
  'fork' |
  'rdb-unlink-temp-file'
);

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(event: LatencyEventType) {
    return ['LATENCY', 'HISTORY', event];
  },
  transformReply: undefined as unknown as () => ArrayReply<TuplesReply<[
    timestamp: NumberReply,
    latency: NumberReply
  ]>>
} as const satisfies Command;

