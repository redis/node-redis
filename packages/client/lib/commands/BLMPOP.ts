import { RedisCommandArguments } from '.';
import { transformLMPopArguments, LMPopOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 3;

export function transformArguments(
    timeout: number,
    keys: string | Array<string>,
    options: LMPopOptions
): RedisCommandArguments {
    return transformLMPopArguments(['BLMPOP', timeout.toString()], keys, options);
}

export { transformReply } from './LMPOP';
