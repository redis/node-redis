import { RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(args: Array<string>): RedisCommandArguments {
    return ['COMMAND', 'GETKEYS', ...args];
}

declare function transformReply(): Array<string>;
