import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export type ArMSetObject = Record<string | number, RedisArgument>;

export type ArMSetMap = Map<number | string, RedisArgument>;

export type ArMSetTuples = Array<[number | string, RedisArgument]>;

export type ArMSetEntries = ArMSetObject | ArMSetMap | ArMSetTuples;

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, entries: ArMSetEntries) {
    parser.push('ARMSET');
    parser.pushKey(key);

    if (entries instanceof Map) {
      for (const [index, value] of entries.entries()) {
        parser.push(index.toString(), value);
      }
    } else if (Array.isArray(entries)) {
      for (const [index, value] of entries) {
        parser.push(index.toString(), value);
      }
    } else {
      for (const index of Object.keys(entries)) {
        parser.push(index, entries[index]);
      }
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
