import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Timestamp, transformTimestampArgument } from './helpers';
import { ArrayReply, NumberReply, SimpleErrorReply, Command } from '@redis/client/dist/lib/RESP/types';

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
