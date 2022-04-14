import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformLMPopArguments, LMPopOptions, ListSide } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
    keys: RedisCommandArgument | Array<RedisCommandArgument>,
    side: ListSide,
    options?: LMPopOptions
): RedisCommandArguments {
    return transformLMPopArguments(
        ['LMPOP'],
        keys,
        side,
        options
    );
}

export declare function transformReply(): null | [
    key: string,
    elements: Array<string>
];
