import { RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(): RedisCommandArguments {
    return ['COMMAND', 'COUNT'];
}

export declare function transformReply(): number;
