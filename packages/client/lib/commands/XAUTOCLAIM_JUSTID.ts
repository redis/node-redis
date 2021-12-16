import { RedisCommandArguments } from '.';
import { transformArguments as transformXAutoClaimArguments } from './XAUTOCLAIM';

export { FIRST_KEY_INDEX } from './XAUTOCLAIM';

export function transformArguments(...args: Parameters<typeof transformXAutoClaimArguments>): RedisCommandArguments {
    return [
        ...transformXAutoClaimArguments(...args),
        'JUSTID'
    ];
}

interface XAutoClaimJustIdReply {
    nextId: string;
    messages: Array<string>;
}

export function transformReply(reply: [string, Array<string>]): XAutoClaimJustIdReply {
    return {
        nextId: reply[0],
        messages: reply[1]
    };
}
