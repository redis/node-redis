export function transformReplyNumber(reply: number): number {
    return reply;
}

export function transformReplyString(reply: string): string {
    return reply;
}

export function transformReplyStringArray(reply: Array<string>): Array<string> {
    return reply;
}

export function transformReplyBoolean(reply: number): boolean {
    return reply === 1;
}

export function transformReplyBooleanArray(reply: Array<number>): Array<boolean> {
    return reply.map(transformReplyBoolean);
}

export interface ScanOptions {
    MATCH?: string;
    COUNT?: number;
}

export function transformScanArguments(cursor: number, options?: ScanOptions): Array<string> {
    const args = [cursor.toString()];

    if (options?.MATCH) {
        args.push('MATCH', options.MATCH);
    }

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }
    
    return args;
}

export interface ScanReply {
    cursor: number;
    keys: Array<string>;
}

export function transformScanReply([cursor, keys]: [string, Array<string>]): ScanReply {
    return {
        cursor: Number(cursor),
        keys
    };
}

export function transformReplyNumberInfinity(reply: string): number {
    switch (reply) {
        case '+inf':
            return Infinity;
        
        case '-inf':
            return -Infinity;

        default:
            return Number(reply);
    }
}

export function transformReplyNumberInfinityArray(reply: Array<string>): Array<number | null> {
    return reply.map(transformReplyNumberInfinity);
}

export function transformReplyNumberInfinityNull(reply: string | null): number | null {
    if (reply === null) return null;

    return transformReplyNumberInfinity(reply);
}

export function transformReplyNumberInfinityNullArray(reply: Array<string | null>): Array<number | null> {
    return reply.map(transformReplyNumberInfinityNull);
}

export function transformArgumentNumberInfinity(num: number): string {
    switch (num) {
        case Infinity:
            return '+inf';
        
        case -Infinity:
            return '-inf';

        default:
            return num.toString();
    }
}

export interface StreamMessage {
    [field: string]: string;
}

export function transformReplyStreamMessage(reply: Array<string>): StreamMessage {
    const message = Object.create(null);

    for (let i = 0; i < reply.length; i += 2) {
        message[reply[i]] = reply[i + 1];
    }

    return message;
}

export interface StreamMessageReply {
    id: string;
    message: StreamMessage;
}

export type StreamMessagesReply = Array<StreamMessageReply>;

export function transformReplyStreamMessages(reply: Array<any>): StreamMessagesReply {
    const messages = [];

    for (let i = 0; i < reply.length; i += 2) {
        messages.push({
            id: reply[i],
            message: transformReplyStreamMessage(reply[i + 1])
        });
    }

    return messages;
}

export type StreamsMessagesReply = Array<{
    name: string;
    messages: StreamMessagesReply;
}>;

export function transformReplyStreamsMessages(reply: Array<any>): StreamsMessagesReply {
    const streams = [];

    for (let i = 0; i < reply.length; i+= 2) {
        streams.push({
            name: reply[i],
            messages: transformReplyStreamMessages(reply[i + 1])
        });
    }

    return streams
}

export function transformReplyStreamsMessagesNull(reply: Array<any> | null): StreamsMessagesReply | null {
    if (reply === null) return null;

    return transformReplyStreamsMessages(reply);
}
