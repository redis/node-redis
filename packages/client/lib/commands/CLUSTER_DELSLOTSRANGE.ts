import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { parseSlotRangesArguments, SlotRange } from './generic-transformers';

export default {
  parseCommand(parser:CommandParser, ranges: SlotRange | Array<SlotRange>) {
    parser.push('CLUSTER', 'DELSLOTSRANGE');
    parseSlotRangesArguments(parser, ranges);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
