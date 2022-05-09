import { RedisCommandArgument, RedisCommandArguments } from '.';
import { RangeReply, RawRangeReply, transformRangeReply } from './generic-transformers';
import { transformArguments as transformLcsArguments } from './LCS';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './LCS';

export function transformArguments(
    key1: RedisCommandArgument,
    key2: RedisCommandArgument
): RedisCommandArguments {
    const args = transformLcsArguments(key1, key2);
    args.push('IDX');
    return args;
}

type RawReply = [
    'matches',
    Array<[
        key1: RawRangeReply,
        key2: RawRangeReply
    ]>,
    'len',
    number
];

interface Reply {
    matches: Array<{
        key1: RangeReply;
        key2: RangeReply;
    }>;
    length: number;
}

export function transformReply(reply: RawReply): Reply {
    return {
        matches: reply[1].map(([key1, key2]) => ({
            key1: transformRangeReply(key1),
            key2: transformRangeReply(key2)
        })),
        length: reply[3]
    };
}
