export const FIRST_KEY_INDEX = (streams: Array<XReadStream> | XReadStream): string => {
    return Array.isArray(streams) ? streams[0].key : streams.key;
};

export const IS_READ_ONLY = true;

interface XReadStream {
    key: string;
    id: string;
}

interface XReadOptions {
    COUNT?: number;
    BLOCK?: number;
}

export function transformArguments(streams: Array<XReadStream> | XReadStream, options?: XReadOptions): Array<string> {
    const args = ['XREAD'];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    if (typeof options?.BLOCK === 'number') {
        args.push('BLOCK', options.BLOCK.toString());
    }

    args.push('STREAMS');

    const streamsArray = Array.isArray(streams) ? streams : [streams],
        argsLength = args.length;
    for (let i = 0; i < streamsArray.length; i++) {
        const stream = streamsArray[i];
        args[argsLength + i] = stream.key;
        args[argsLength + streamsArray.length + i] = stream.id;
    }

    return args;
}

export { transformReplyStreamsMessages as transformReply } from './generic-transformers';
