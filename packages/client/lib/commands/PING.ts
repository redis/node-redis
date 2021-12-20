import { RedisCommandArgument } from '.';

export function transformArguments(): Array<string> {
    return ['PING'];
}

export declare function transformReply(): RedisCommandArgument;
