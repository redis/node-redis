import { transformArguments as transformZPopMaxArguments } from './ZPOPMAX';

export { FIRST_KEY_INDEX } from './ZPOPMAX';

export function transformArguments(key: string, count: number): Array<string> {
    return [
        ...transformZPopMaxArguments(key),
        count.toString()
    ];
}

export { transformReplySortedSetWithScores as transformReply } from './generic-transformers';
