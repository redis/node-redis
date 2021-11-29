import {
    transformArguments as transformInfoArguments,
    InfoRawReply,
    InfoReply,
    transformReply as transformInfoReply
} from './INFO';

export { IS_READ_ONLY, FIRST_KEY_INDEX } from './INFO';

export function transformArguments(key: string): Array<string> {
    const args = transformInfoArguments(key);
    args.push('DEBUG');
    return args;
}

type InfoDebugRawReply = [
    ...infoArgs: InfoRawReply,
    _: string,
    chunks: Array<[
        _: string,
        startTimestamp: number,
        _: string,
        endTimestamp: number,
        _: string,
        samples: number,
        _: string,
        size: number,
        _: string,
        bytesPerSample: string
    ]>
]

interface InfoDebugReply extends InfoReply {
    chunks: Array<{
        startTimestamp: number;
        endTimestamp: number;
        samples: number;
        size: number;
        bytesPerSample: string;
    }>;
}

export function transformReply(rawReply: InfoDebugRawReply): InfoDebugReply {
    const reply = transformInfoReply(rawReply as unknown as InfoRawReply);
    (reply as InfoDebugReply).chunks = rawReply[25].map(chunk => ({
        startTimestamp: chunk[1],
        endTimestamp: chunk[3],
        samples: chunk[5],
        size: chunk[7],
        bytesPerSample: chunk[9]
    }));
    return reply as InfoDebugReply;
}
