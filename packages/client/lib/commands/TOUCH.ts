import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  // The server tags TOUCH with flags `[readonly, fast]` — no `write` flag,
  // because it does not modify any value. So the metadata-derived
  // `isReplicaSafe` (keyed, not `write`, not `script_runner` ⇒ replica-safe)
  // would route it to a replica. That is wrong: TOUCH's only effect is bumping
  // each key's LRU/LFU access metadata, which drives eviction decisions on the
  // MASTER. Run on a replica it mutates replica-local counters and returns a
  // count while leaving the master's eviction state untouched. It is the one
  // "readonly-flagged but write-effect" command, so pin it master-only
  // explicitly (the override wins over the derived value).
  IS_READ_ONLY: false,
  CACHEABLE: false,
  parseCommand(parser: CommandParser, key: RedisVariadicArgument) {
    parser.push('TOUCH');
    parser.pushKeys(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
