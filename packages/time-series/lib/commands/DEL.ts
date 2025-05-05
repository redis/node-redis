import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Timestamp, transformTimestampArgument } from './helpers';
import { RedisArgument, NumberReply, Command, } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, fromTimestamp: Timestamp, toTimestamp: Timestamp) {
    parser.push('TS.DEL');
    parser.pushKey(key);
    parser.push(transformTimestampArgument(fromTimestamp), transformTimestampArgument(toTimestamp));
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
