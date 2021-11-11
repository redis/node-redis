export function transformArguments(key: string, db: number): Array<string> {
    return ['MOVE', key, db.toString()];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
