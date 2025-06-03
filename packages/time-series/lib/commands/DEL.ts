import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Timestamp, transformTimestampArgument } from './helpers';
import { RedisArgument, NumberReply, Command, } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Deletes samples between two timestamps from a time series
   * @param parser - The command parser
   * @param key - The key name of the time series
   * @param fromTimestamp - Start timestamp to delete from
   * @param toTimestamp - End timestamp to delete until
   */
  parseCommand(parser: CommandParser, key: RedisArgument, fromTimestamp: Timestamp, toTimestamp: Timestamp) {
    parser.push('TS.DEL');
    parser.pushKey(key);
    parser.push(transformTimestampArgument(fromTimestamp), transformTimestampArgument(toTimestamp));
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
