import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushVerdictArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: string,
    items: string | Array<string>
): RedisCommandArguments {
    return pushVerdictArguments(['TOPK.ADD', key], items);
}

export declare function transformReply(): Array<null | string>;
