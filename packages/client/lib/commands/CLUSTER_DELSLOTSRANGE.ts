import { SimpleStringReply, Command } from '../RESP/types';
import { pushSlotRangesArguments, SlotRange } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(ranges: SlotRange | Array<SlotRange>) {
    return pushSlotRangesArguments(
      ['CLUSTER', 'DELSLOTSRANGE'],
      ranges
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
