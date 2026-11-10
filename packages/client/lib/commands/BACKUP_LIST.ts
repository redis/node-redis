import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';

/**
 * Returns the absolute paths of the backup files pinned so far: the base file while
 * the backup is in progress, and the base, incremental and manifest files once it is sealed.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('BACKUP', 'LIST');
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
