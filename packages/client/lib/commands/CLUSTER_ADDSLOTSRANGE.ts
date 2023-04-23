import { SimpleStringReply, Command } from '../RESP/types';
import { pushSlotRangesArguments, SlotRange } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  transformArguments(ranges: SlotRange | Array<SlotRange>) {
    return pushSlotRangesArguments(
      ['CLUSTER', 'ADDSLOTSRANGE'],
      ranges
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
