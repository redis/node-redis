import { NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, slot: number) {
    parser.pushVariadic(['CLUSTER', 'COUNTKEYSINSLOT', slot.toString()]);
  },
  transformArguments(slot: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
