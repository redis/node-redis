import { RedisCommandArgument } from '.';

export function transformArguments(): Array<string> {
    return ['SAVE'];
}

export declare function transformReply(): RedisCommandArgument;
