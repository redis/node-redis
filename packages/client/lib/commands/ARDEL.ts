import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export type ArIndex = number | string;

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, indices: ArIndex | Array<ArIndex>) {
    parser.push('ARDEL');
    parser.pushKey(key);
    if (Array.isArray(indices)) {
      for (const i of indices) parser.push(i.toString());
    } else {
      parser.push(indices.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
