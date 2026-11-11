import { CommandParser } from '../client/parser';
import { TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export type BackupState = 'idle' | 'pending' | 'snapshotting' | 'incrementing' | 'sealed' | 'failed';

export type BackupStatusReply = TuplesToMapReply<[
  [BlobStringReply<'state'>, BlobStringReply<BackupState>],
  [BlobStringReply<'error'>, BlobStringReply],
  [BlobStringReply<'start_time'>, NumberReply],
  [BlobStringReply<'end_time'>, NumberReply]
]>;

/**
 * Returns the state of the current backup, its error message if it failed,
 * and its start and end times.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('BACKUP', 'STATUS');
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<BackupStatusReply>>) => ({
      state: reply[1],
      error: reply[3],
      start_time: reply[5],
      end_time: reply[7]
    }),
    3: undefined as unknown as () => BackupStatusReply
  }
} as const satisfies Command;
