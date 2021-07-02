export function transformReplyNumber(reply: number): number {
    return reply;
}

export function transformReplyNumberNull(reply: number | null): number | null {
    return reply;
}

export function transformReplyNumberArray(reply: Array<number>): Array<number> {
    return reply;
}

export function transformReplyNumberNullArray(reply: Array<number | null>): Array<number | null> {
    return reply;
}

export function transformReplyString(reply: string): string {
    return reply;
}

export function transformReplyStringNull(reply: string | null): string | null {
    return reply;
}

export function transformReplyStringArray(reply: Array<string>): Array<string> {
    return reply;
}

export function transformReplyStringArrayNull(reply: Array<string> | null): Array<string> | null {
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

export interface TuplesObject {
    [field: string]: string;
}

export function transformReplyTuples(reply: Array<string>): TuplesObject {
    const message = Object.create(null);

    for (let i = 0; i < reply.length; i += 2) {
        message[reply[i]] = reply[i + 1];
    }

    return message;
}

export function transformReplyTuplesNull(reply: Array<string> | null): TuplesObject | null {
    if (reply === null) return null;

    return transformReplyTuples(reply);
}

export interface StreamMessageReply {
    id: string;
    message: TuplesObject;
}

export type StreamMessagesReply = Array<StreamMessageReply>;

export function transformReplyStreamMessages(reply: Array<any>): StreamMessagesReply {
    const messages = [];

    for (let i = 0; i < reply.length; i += 2) {
        messages.push({
            id: reply[i],
            message: transformReplyTuples(reply[i + 1])
        });
    }

    return messages;
}

export type StreamsMessagesReply = Array<{
    name: string;
    messages: StreamMessagesReply;
}>;

export function transformReplyStreamsMessages(reply: Array<any>): StreamsMessagesReply {
    return reply.map(([name, rawMessages]) => ({
        name,
        messages: transformReplyStreamMessages(rawMessages)
    }));
}

export function transformReplyStreamsMessagesNull(reply: Array<any> | null): StreamsMessagesReply | null {
    if (reply === null) return null;

    return transformReplyStreamsMessages(reply);
}

export interface ZMember {
    score: number;
    value: string;
}

export function transformReplySortedSetWithScores(reply: Array<string>): Array<ZMember> {
    const members = [];

    for (let i = 0; i < reply.length; i += 2) {
        members.push({
            value: reply[i],
            score: transformReplyNumberInfinity(reply[i + 1])
        });
    }

    return members;
}
