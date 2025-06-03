import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Deletes a compaction rule between source and destination time series
   * @param parser - The command parser
   * @param sourceKey - The source time series key
   * @param destinationKey - The destination time series key
   */
  parseCommand(parser: CommandParser, sourceKey: RedisArgument, destinationKey: RedisArgument) {
    parser.push('TS.DELETERULE');
    parser.pushKeys([sourceKey, destinationKey]);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
