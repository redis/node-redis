import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformXAutoClaimArguments } from './XAUTOCLAIM';

export { FIRST_KEY_INDEX } from './XAUTOCLAIM';

export function transformArguments(...args: Parameters<typeof transformXAutoClaimArguments>): RedisCommandArguments {
    return [
        ...transformXAutoClaimArguments(...args),
        'JUSTID'
    ];
}

type XAutoClaimJustIdRawReply = [RedisCommandArgument, Array<RedisCommandArgument>];

interface XAutoClaimJustIdReply {
    nextId: RedisCommandArgument;
    messages: Array<RedisCommandArgument>;
}

export function transformReply(reply: XAutoClaimJustIdRawReply): XAutoClaimJustIdReply {
    return {
        nextId: reply[0],
        messages: reply[1]
    };
}
