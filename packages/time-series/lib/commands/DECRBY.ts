import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { IncrDecrOptions, transformIncrDecrArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, value: number, options?: IncrDecrOptions): RedisCommandArguments {
    return transformIncrDecrArguments('TS.DECRBY', key, value, options);
}

export declare function transformReply(): number;
