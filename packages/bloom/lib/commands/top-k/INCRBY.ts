export const FIRST_KEY_INDEX = 1;

interface IncrByItem {
    item: string;
    incrementBy: number;
}

export function transformArguments(
    key: string,
    items: IncrByItem | Array<IncrByItem>
): Array<string> {
    const args = ['TOPK.INCRBY', key];

    if (Array.isArray(items)) {
        for (const item of items) {
            pushIncrByItem(args, item);
        }
    } else {
        pushIncrByItem(args, items);
    }

    return args;
}

function pushIncrByItem(args: Array<string>, { item, incrementBy }: IncrByItem): void {
    args.push(item, incrementBy.toString());
}

export declare function transformReply(): Array<string | null>;
