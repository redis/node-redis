import { RedisCommandArgument, RedisCommandArguments } from '.';
import { AuthOptions } from './AUTH';

interface HelloOptions {
    protover: number;
    auth?: Required<AuthOptions>;
    clientName?: string;
}

export function transformArguments(options?: HelloOptions): RedisCommandArguments {
    const args: RedisCommandArguments = ['HELLO'];

    if (options) {
        args.push(options.protover.toString());

        if (options.auth) {
            args.push('AUTH', options.auth.username, options.auth.password);
        }

        if (options.clientName) {
            args.push('SETNAME', options.clientName);
        }
    }

    return args;
}

type HelloRawReply = [
    _: never,
    server: RedisCommandArgument,
    _: never,
    version: RedisCommandArgument,
    _: never,
    proto: number,
    _: never,
    id: number,
    _: never,
    mode: RedisCommandArgument,
    _: never,
    role: RedisCommandArgument,
    _: never,
    modules: Array<RedisCommandArgument>
];

interface HelloTransformedReply {
    server: RedisCommandArgument;
    version: RedisCommandArgument;
    proto: number;
    id: number;
    mode: RedisCommandArgument;
    role: RedisCommandArgument;
    modules: Array<RedisCommandArgument>;
}

export function transformReply(reply: HelloRawReply): HelloTransformedReply {
    return {
        server: reply[1],
        version: reply[3],
        proto: reply[5],
        id: reply[7],
        mode: reply[9],
        role: reply[11],
        modules: reply[13]
    };
}
