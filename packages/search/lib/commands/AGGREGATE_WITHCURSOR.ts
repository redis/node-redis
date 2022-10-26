import {
    AggregateOptions,
    AggregateRawReply,
    AggregateReply,
    transformArguments as transformAggregateArguments,
    transformReply as transformAggregateReply
} from './AGGREGATE';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './AGGREGATE';

interface AggregateWithCursorOptions extends AggregateOptions {
    COUNT?: number;
}

export function transformArguments(
    index: string,
    query: string,
    options?: AggregateWithCursorOptions
) {
    const args = transformAggregateArguments(index, query, options);

    args.push('WITHCURSOR');
    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

type AggregateWithCursorRawReply = [
    result: AggregateRawReply,
    cursor: number
];

interface AggregateWithCursorReply extends AggregateReply {
    cursor: number;
}

export function transformReply(reply: AggregateWithCursorRawReply): AggregateWithCursorReply {
    return {
        ...transformAggregateReply(reply[0]),
        cursor: reply[1]
    };
}
