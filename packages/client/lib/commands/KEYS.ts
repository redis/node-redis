import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(pattern: RedisCommandArgument): RedisCommandArguments {
    return ['KEYS', pattern];
}

export declare function transformReply(): Array<RedisCommandArgument>;
