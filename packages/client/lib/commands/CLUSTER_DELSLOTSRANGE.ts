import { RedisCommandArguments } from '.';
import { pushSlotRangesArguments, SlotRange } from './generic-transformers';

export function transformArguments(
    ranges: SlotRange | Array<SlotRange>
): RedisCommandArguments {
    return pushSlotRangesArguments(
        ['CLUSTER', 'DELSLOTSRANGE'],
        ranges
    );
}

export declare function transformReply(): 'OK';
