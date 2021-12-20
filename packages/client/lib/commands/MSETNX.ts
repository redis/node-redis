import { RedisCommandArguments } from '.';
import { MSetArguments } from './MSET';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(toSet: MSetArguments): RedisCommandArguments {
    const args: RedisCommandArguments = ['MSETNX'];

    if (Array.isArray(toSet)) {
        args.push(...toSet.flat());
    } else {
        for (const key of Object.keys(toSet)) {
            args.push(key, toSet[key]);
        }
    }

    return args;
}

export { transformBooleanReply as transformReply } from './generic-transformers';
