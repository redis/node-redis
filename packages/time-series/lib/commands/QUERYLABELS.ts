import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, BlobStringReply, SetReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { parseQueryLabelsFilterArgument } from './helpers';

/**
 * `TS.QUERYLABELS LABELS [FILTER filterExpr ...]` — the set of all label names
 * present on at least one matching (and readable) time series. Added in
 * RedisTimeSeries 8.10. Keyless; in cluster mode the server performs the
 * cluster-wide fan-out and returns a single merged, deduplicated reply.
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, filter?: RedisVariadicArgument) {
    parser.push('TS.QUERYLABELS', 'LABELS');
    parseQueryLabelsFilterArgument(parser, filter);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
