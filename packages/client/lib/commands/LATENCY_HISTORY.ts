import { CommandParser } from '../client/parser';
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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LATENCY HISTORY command
   * 
   * @param parser - The command parser
   * @param event - The latency event to get the history for
   * @see https://redis.io/commands/latency-history/
   */
  parseCommand(parser: CommandParser, event: LatencyEventType) {
    parser.push('LATENCY', 'HISTORY', event);
  },
  transformReply: undefined as unknown as () => ArrayReply<TuplesReply<[
    timestamp: NumberReply,
    latency: NumberReply
  ]>>
} as const satisfies Command;

