import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  // Keyless read: replica-safe, but the metadata-derived isReplicaSafe
  // returns false for keyless commands, so opt in explicitly (restores the
  // pre-derivation master behavior).
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, pattern: RedisArgument) {
    parser.push('KEYS', pattern);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
