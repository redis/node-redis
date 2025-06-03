import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the number of keys in the specified hash slot
   * @param parser - The Redis command parser
   * @param slot - The hash slot to check
   */
  parseCommand(parser: CommandParser, slot: number) {
    parser.push('CLUSTER', 'COUNTKEYSINSLOT', slot.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
