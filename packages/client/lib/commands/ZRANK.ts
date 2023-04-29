import { RedisCommandArgument, RedisCommandArguments } from '.';
import { RankOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    member: RedisCommandArgument,
    options?: RankOptions
): RedisCommandArguments {
    const args = ['ZRANK', key, member];

    if (options?.WITHSCORE) {
        args.push('WITHSCORE');
    }

    return args;
}

export declare function transformReply(): number | Array<number> | null;
