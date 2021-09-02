import { transformReplyBoolean } from './generic-transformers';

export function transformArguments(key: string, db: number): Array<string> {
    return ['MOVE', key, db.toString()];
}

export const transformReply = transformReplyBoolean;