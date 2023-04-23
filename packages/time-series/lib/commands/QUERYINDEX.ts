import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { Filter } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(filter: Filter): RedisCommandArguments {
    return pushVariadicArguments(['TS.QUERYINDEX'], filter);
}

export declare function transformReply(): Array<string>;
