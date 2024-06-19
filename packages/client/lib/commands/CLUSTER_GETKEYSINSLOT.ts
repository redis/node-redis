import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, slot: number, count: number) {
    parser.pushVariadic(['CLUSTER', 'GETKEYSINSLOT', slot.toString(), count.toString()]);
  },
  transformArguments(slot: number, count: number) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
