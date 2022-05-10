import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['FUNCTION', 'DUMP'];
}

export declare function transformReply(): RedisCommandArgument;
