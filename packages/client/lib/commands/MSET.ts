import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export type MSetArguments =
    Array<[RedisCommandArgument, RedisCommandArgument]> |
    Array<RedisCommandArgument> |
    Record<string, RedisCommandArgument>;

export function transformArguments(toSet: MSetArguments): RedisCommandArguments {
    const args: RedisCommandArguments = ['MSET'];

    if (Array.isArray(toSet)) {
        args.push(...toSet.flat());
    } else {
        for (const key of Object.keys(toSet)) {
            args.push(key, toSet[key]);
        }
    }

    return args;
}

export declare function transformReply(): RedisCommandArgument;
