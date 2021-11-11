import { RedisCommandArguments } from '.';

export function transformReplyBoolean(reply: number): boolean {
    return reply === 1;
}

export function transformReplyBooleanArray(reply: Array<number>): Array<boolean> {
    return reply.map(transformReplyBoolean);
}

export type BitValue = 0 | 1;

export interface ScanOptions {
    MATCH?: string;
    COUNT?: number;
}

export function pushScanArguments(args: Array<string>, cursor: number, options?: ScanOptions): Array<string> {
    args.push(cursor.toString());

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

export interface StreamMessageReply {
    id: string;
    message: TuplesObject;
}

export type StreamMessagesReply = Array<StreamMessageReply>;

export function transformReplyStreamMessages(reply: Array<any>): StreamMessagesReply {
    const messages = [];

    for (const [id, message] of reply) {
        messages.push({
            id,
            message: transformReplyTuples(message)
        });
    }

    return messages;
}

export type StreamsMessagesReply = Array<{
    name: string;
    messages: StreamMessagesReply;
}> | null;

export function transformReplyStreamsMessages(reply: Array<any> | null): StreamsMessagesReply | null {
    if (reply === null) return null;

    return reply.map(([name, rawMessages]) => ({
        name,
        messages: transformReplyStreamMessages(rawMessages)
    }));
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

type GeoCountArgument = number | {
    value: number;
    ANY?: true
};

export function pushGeoCountArgument(args: Array<string>, count: GeoCountArgument | undefined): Array<string> {
    if (typeof count === 'number') {
        args.push('COUNT', count.toString());
    } else if (count) {
        args.push('COUNT', count.value.toString());

        if (count.ANY) {
            args.push('ANY');
        }
    }

    return args;
}

export type GeoUnits = 'm' | 'km' | 'mi' | 'ft';

export interface GeoCoordinates {
    longitude: string | number;
    latitude: string | number;
}

type GeoSearchFromMember = string;

export type GeoSearchFrom = GeoSearchFromMember | GeoCoordinates;

interface GeoSearchByRadius {
    radius: number;
    unit: GeoUnits;
}

interface GeoSearchByBox {
    width: number;
    height: number;
    unit: GeoUnits;
}

export type GeoSearchBy = GeoSearchByRadius | GeoSearchByBox;

export interface GeoSearchOptions {
    SORT?: 'ASC' | 'DESC';
    COUNT?: GeoCountArgument;
}

export function pushGeoSearchArguments(
    args: Array<string>,
    key: string,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchOptions
): Array<string> {
    args.push(key);

    if (typeof from === 'string') {
        args.push('FROMMEMBER', from);
    } else {
        args.push('FROMLONLAT', from.longitude.toString(), from.latitude.toString());
    }

    if ('radius' in by) {
        args.push('BYRADIUS', by.radius.toString());
    } else {
        args.push('BYBOX', by.width.toString(), by.height.toString());
    }

    args.push(by.unit);

    if (options?.SORT) {
        args.push(options.SORT);
    }

    pushGeoCountArgument(args, options?.COUNT);

    return args;
}

export enum GeoReplyWith {
    DISTANCE = 'WITHDIST',
    HASH = 'WITHHASH',
    COORDINATES = 'WITHCOORD'
}

export interface GeoReplyWithMember {
    member: string;
    distance?: number;
    hash?: string;
    coordinates?: {
        longitude: string;
        latitude: string;
    };
}

export function transformGeoMembersWithReply(reply: Array<Array<any>>, replyWith: Array<GeoReplyWith>): Array<GeoReplyWithMember> {
    const replyWithSet = new Set(replyWith);

    let index = 0;
    const distanceIndex = replyWithSet.has(GeoReplyWith.DISTANCE) && ++index,
        hashIndex = replyWithSet.has(GeoReplyWith.HASH) && ++index,
        coordinatesIndex = replyWithSet.has(GeoReplyWith.COORDINATES) && ++index;

    return reply.map(member => {
        const transformedMember: GeoReplyWithMember = {
            member: member[0]
        };

        if (distanceIndex) {
            transformedMember.distance = member[distanceIndex];
        }

        if (hashIndex) {
            transformedMember.hash = member[hashIndex];
        }

        if (coordinatesIndex) {
            const [longitude, latitude] = member[coordinatesIndex];
            transformedMember.coordinates = {
                longitude,
                latitude
            };
        }

        return transformedMember;
    });
}

export function transformEXAT(EXAT: number | Date): string {
    return (typeof EXAT === 'number' ? EXAT : Math.floor(EXAT.getTime() / 1000)).toString();
}

export function transformPXAT(PXAT: number | Date): string {
    return (typeof PXAT === 'number' ? PXAT : PXAT.getTime()).toString();
}

export interface EvalOptions {
    keys?: Array<string>;
    arguments?: Array<string>;
}

export function pushEvalArguments(args: Array<string>, options?: EvalOptions): Array<string> {
    if (options?.keys) {
        args.push(
            options.keys.length.toString(),
            ...options.keys
        );
    } else {
        args.push('0');
    }

    if (options?.arguments) {
        args.push(...options.arguments);
    }

    return args;
}

export type StringTuplesArguments = Array<[string, string]> | Array<string> | Record<string, string>;

export function pushStringTuplesArguments(args: Array<string>, tuples: StringTuplesArguments): Array<string> {
    if (Array.isArray(tuples)) {
        args.push(...tuples.flat());
    } else {
        for (const key of Object.keys(tuples)) {
            args.push(key, tuples[key]);
        }
    }

    return args;
}

export function pushVerdictArguments(args: RedisCommandArguments, value: string | Buffer | Array<string | Buffer>): RedisCommandArguments  {
    if (Array.isArray(value)) {
        args.push(...value);
    } else {
        args.push(value);
    }

    return args;
}

export function pushVerdictArgument(args: RedisCommandArguments, value: string | Array<string>): RedisCommandArguments {
    if (typeof value === 'string') {
        args.push('1', value);
    } else {
        args.push(value.length.toString(), ...value);
    }

    return args;
}

export function pushOptionalVerdictArgument(args: RedisCommandArguments, name: string, value: undefined | string | Array<string>): RedisCommandArguments {
    if (value === undefined) return args;

    args.push(name);

    return pushVerdictArgument(args, value);
}

export enum CommandFlags {
    WRITE = 'write', // command may result in modifications
    READONLY = 'readonly', // command will never modify keys
    DENYOOM = 'denyoom', // reject command if currently out of memory
    ADMIN = 'admin', // server admin command
    PUBSUB = 'pubsub', // pubsub-related command
    NOSCRIPT = 'noscript', // deny this command from scripts
    RANDOM = 'random', // command has random results, dangerous for scripts
    SORT_FOR_SCRIPT = 'sort_for_script', // if called from script, sort output
    LOADING = 'loading', // allow command while database is loading
    STALE = 'stale', // allow command while replica has stale data
    SKIP_MONITOR = 'skip_monitor', // do not show this command in MONITOR
    ASKING = 'asking', // cluster related - accept even if importing
    FAST = 'fast', // command operates in constant or log(N) time. Used for latency monitoring.
    MOVABLEKEYS = 'movablekeys' // keys have no pre-determined position. You must discover keys yourself.
}

export enum CommandCategories {
    KEYSPACE = '@keyspace',
    READ = '@read',
    WRITE = '@write',
    SET = '@set',
    SORTEDSET = '@sortedset',
    LIST = '@list',
    HASH = '@hash',
    STRING = '@string',
    BITMAP = '@bitmap',
    HYPERLOGLOG = '@hyperloglog',
    GEO = '@geo',
    STREAM = '@stream',
    PUBSUB = '@pubsub',
    ADMIN = '@admin',
    FAST = '@fast',
    SLOW = '@slow',
    BLOCKING = '@blocking',
    DANGEROUS = '@dangerous',
    CONNECTION = '@connection',
    TRANSACTION = '@transaction',
    SCRIPTING = '@scripting'
}

export type CommandRawReply = [
    name: string,
    arity: number,
    flags: Array<CommandFlags>,
    firstKeyIndex: number,
    lastKeyIndex: number,
    step: number,
    categories: Array<CommandCategories>
];

export type CommandReply = {
    name: string,
    arity: number,
    flags: Set<CommandFlags>,
    firstKeyIndex: number,
    lastKeyIndex: number,
    step: number,
    categories: Set<CommandCategories>
};

export function transformCommandReply(
    this: void,
    [name, arity, flags, firstKeyIndex, lastKeyIndex, step, categories]: CommandRawReply
): CommandReply {
    return {
        name,
        arity,
        flags: new Set(flags),
        firstKeyIndex,
        lastKeyIndex,
        step,
        categories: new Set(categories)
    };
}
