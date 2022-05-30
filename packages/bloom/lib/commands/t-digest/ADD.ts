import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

interface TDigestItem {
    value: number;
    weight: number;
}

export function transformArguments(
    key: RedisCommandArgument,
    items: TDigestItem | Array<TDigestItem>
): RedisCommandArguments {
    const args = ['TDIGEST.ADD', key];

    if (Array.isArray(items)) {
        for (const item of items) {
            pushItem(args, item);
        }
    } else {
        pushItem(args, items);
    }

    return args;
}

function pushItem(args: RedisCommandArguments, item: TDigestItem) {
    args.push(
        item.value.toString(),
        item.weight.toString()
    );
}

export declare function transformReply(): 'OK';
