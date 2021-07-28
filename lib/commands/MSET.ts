import { transformReplyBoolean } from './generic-transformers';

export function transformArguments(key: string, db: number): Array<string> {
    return ['MSET', key, db.toString()];
}

export const transformReply = transformReplyBoolean;