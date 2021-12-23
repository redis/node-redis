import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformSRandMemberArguments } from './SRANDMEMBER';

export { FIRST_KEY_INDEX } from './SRANDMEMBER';

export function transformArguments(
    key: RedisCommandArgument,
    count: number
): RedisCommandArguments {
    return [
        ...transformSRandMemberArguments(key),
        count.toString()
    ];
}

export declare function transformReply(): Array<RedisCommandArgument>;
