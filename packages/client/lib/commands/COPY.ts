interface CopyCommandOptions {
    destinationDb?: number;
    replace?: boolean;
}

export const FIRST_KEY_INDEX = 1;

export function transformArguments(source: string, destination: string, options?: CopyCommandOptions): Array<string> {
    const args = ['COPY', source, destination];

    if (options?.destinationDb) {
        args.push('DB', options.destinationDb.toString());
    }

    if (options?.replace) {
        args.push('REPLACE');
    }

    return args;
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
