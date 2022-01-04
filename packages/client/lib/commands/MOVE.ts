export function transformArguments(key: string, db: number): Array<string> {
    return ['MOVE', key, db.toString()];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
