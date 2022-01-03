import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformXClaimArguments } from './XCLAIM';

export { FIRST_KEY_INDEX } from './XCLAIM';

export function transformArguments(...args: Parameters<typeof transformXClaimArguments>): RedisCommandArguments {
    return [
        ...transformXClaimArguments(...args),
        'JUSTID'
    ];
}

export declare function transformReply(): Array<RedisCommandArgument>;
