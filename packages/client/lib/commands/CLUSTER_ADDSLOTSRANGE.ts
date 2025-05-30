import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { parseSlotRangesArguments, SlotRange } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Assigns hash slot ranges to the current node in a Redis Cluster
   * @param parser - The Redis command parser
   * @param ranges - One or more slot ranges to be assigned, each specified as [start, end]
   */
  parseCommand(parser: CommandParser, ranges: SlotRange | Array<SlotRange>) {
    parser.push('CLUSTER', 'ADDSLOTSRANGE');
    parseSlotRangesArguments(parser, ranges);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
