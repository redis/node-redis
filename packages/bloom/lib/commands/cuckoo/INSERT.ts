import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { InsertOptions, pushInsertOptions } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: string,
    items: string | Array<string>,
    options?: InsertOptions
): RedisCommandArguments {
    return pushInsertOptions(
        ['CF.INSERT', key],
        items,
        options
    );
}

export { transformBooleanArrayReply as transformReply } from '@redis/client/dist/lib/commands/generic-transformers';
