import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    ranks: Array<number>
): RedisCommandArguments {
    const args = ['TDIGEST.BYRANK', key];
    for (const rank of ranks) {
        args.push(rank.toString());
    }

    return args;
}

export { transformDoublesReply as transformReply } from '.';
