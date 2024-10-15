import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, slot: number) {
    parser.push('CLUSTER', 'COUNTKEYSINSLOT', slot.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
