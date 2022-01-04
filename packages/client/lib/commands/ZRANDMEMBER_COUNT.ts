import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformZRandMemberArguments } from './ZRANDMEMBER';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANDMEMBER';

export function transformArguments(
    key: RedisCommandArgument,
    count: number
): RedisCommandArguments {
    return [
        ...transformZRandMemberArguments(key),
        count.toString()
    ];
}

export declare function transformReply(): Array<RedisCommandArgument>;
