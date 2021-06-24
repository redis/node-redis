import { transformReplyString } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(version?: number, ...optionalArguments: Array<number>): Array<string> {
    const args = ['LOLWUT'];

    if (version) {
        args.push(
            'VERSION',
            version.toString(),
            ...optionalArguments.map(String),
        );
    }

    return args;
}

export const transformReply = transformReplyString;
