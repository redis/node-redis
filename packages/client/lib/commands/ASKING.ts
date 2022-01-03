import { RedisCommandArguments, RedisCommandArgument } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ASKING'];
}

export declare function transformReply(): RedisCommandArgument;
