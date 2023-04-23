import { RedisCommandArguments } from '.';
import { pushVariadicArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string | Array<string>): RedisCommandArguments {
    return pushVariadicArguments(['WATCH'], key);
}

export declare function transformReply(): string;
