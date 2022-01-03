import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(args: Array<RedisCommandArgument>): RedisCommandArguments {
    return ['COMMAND', 'GETKEYS', ...args];
}

export declare function transformReply(): Array<RedisCommandArgument>;
