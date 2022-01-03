import { RedisCommandArgument } from '.';

export function transformArguments(): Array<string> {
    return ['DISCARD'];
}

export declare function transformReply(): RedisCommandArgument;
