import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, slot: number, count: number) {
    parser.push('CLUSTER', 'GETKEYSINSLOT', slot.toString(), count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
