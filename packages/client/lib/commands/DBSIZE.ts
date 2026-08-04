import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  // Keyless read: replica-safe, but the metadata-derived isReplicaSafe
  // returns false for keyless commands, so opt in explicitly (restores the
  // pre-derivation master behavior).
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('DBSIZE');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
