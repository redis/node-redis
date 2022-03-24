import { RedisCommandArguments } from '.';
import { pushSlotRangesArguments, SlotRange } from './generic-transformers';

export function transformArguments(
    ranges: SlotRange | Array<SlotRange>
): RedisCommandArguments {
    return pushSlotRangesArguments(
        ['CLUSTER', 'ADDSLOTSRANGE'],
        ranges
    );
}

export declare function transformReply(): 'OK';
