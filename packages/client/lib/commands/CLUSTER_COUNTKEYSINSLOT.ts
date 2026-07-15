import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, slot: number) {
    parser.push('CLUSTER', 'COUNTKEYSINSLOT', slot.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
