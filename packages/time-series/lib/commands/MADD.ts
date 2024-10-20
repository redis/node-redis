import { CommandParser } from '@redis/client/lib/client/parser';
import { Timestamp, transformTimestampArgument } from '.';
import { ArrayReply, NumberReply, SimpleErrorReply, Command } from '@redis/client/lib/RESP/types';

export interface TsMAddSample {
  key: string;
  timestamp: Timestamp;
  value: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, toAdd: Array<TsMAddSample>) {
    parser.push('TS.MADD');

    for (const { key, timestamp, value } of toAdd) {
      parser.pushKey(key);
      parser.push(transformTimestampArgument(timestamp), value.toString());
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply | SimpleErrorReply>
} as const satisfies Command;
