import { RedisCommandArguments } from '.';
import { SortOptions } from './generic-transformers';
import { transformArguments as transformSortArguments } from './SORT';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: string,
    destination: string,
    options?: SortOptions
): RedisCommandArguments {
    const args = transformSortArguments(source, options);
    args.push('STORE', destination);
    return args;
}

export declare function transformReply(): number;
