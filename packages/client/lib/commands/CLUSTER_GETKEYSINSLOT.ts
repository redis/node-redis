import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns a number of keys from the specified hash slot
   * @param parser - The Redis command parser
   * @param slot - The hash slot to get keys from
   * @param count - Maximum number of keys to return
   */
  parseCommand(parser: CommandParser, slot: number, count: number) {
    parser.push('CLUSTER', 'GETKEYSINSLOT', slot.toString(), count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
