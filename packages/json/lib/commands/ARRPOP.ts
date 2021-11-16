export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path?: string, index?: number): Array<string> {
    const args = ['JSON.ARRPOP', key];

    if (path) {
        args.push(path);

        if (index !== undefined && index !== null) {
            args.push(index.toString());
        }
    }

    return args;
}

export { transformRedisJsonNullArrayReply as transformReply } from '.';
