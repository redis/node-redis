import { Timestamp, transformTimestampArgument } from '.';
import { ArrayReply, NumberReply, SimpleErrorReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TsMAddSample {
  key: string;
  timestamp: Timestamp;
  value: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(toAdd: Array<TsMAddSample>) {
    const args = ['TS.MADD'];

    for (const { key, timestamp, value } of toAdd) {
      args.push(
        key,
        transformTimestampArgument(timestamp),
        value.toString()
      );
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply | SimpleErrorReply>
} as const satisfies Command;
