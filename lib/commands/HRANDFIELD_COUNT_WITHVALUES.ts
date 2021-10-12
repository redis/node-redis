import { transformArguments as transformHRandFieldCountArguments } from './HRANDFIELD_COUNT';

export { FIRST_KEY_INDEX } from './HRANDFIELD_COUNT';

export function transformArguments(key: string, count: number): Array<string> {
    return [
        ...transformHRandFieldCountArguments(key, count),
        'WITHVALUES'
    ];
}

export { transformReplyTuples as transformReply } from './generic-transformers';
