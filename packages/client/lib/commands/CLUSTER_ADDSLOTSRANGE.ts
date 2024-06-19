import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { pushSlotRangesArguments, SlotRange } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, ranges: SlotRange | Array<SlotRange>) {
    parser.pushVariadic(['CLUSTER', 'ADDSLOTSRANGE']);
    pushSlotRangesArguments(parser, ranges);
  },
  transformArguments(ranges: SlotRange | Array<SlotRange>) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
