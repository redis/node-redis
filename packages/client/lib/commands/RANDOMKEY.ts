import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(): RedisCommandArguments {
    return ['RANDOMKEY'];
}

export declare function transformReply(): RedisCommandArgument | null;
