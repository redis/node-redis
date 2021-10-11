import { AuthOptions } from './AUTH';

interface HelloOptions {
    protover: number;
    auth?: Required<AuthOptions>;
    clientName?: string;
}

export function transformArguments(options?: HelloOptions): Array<string> {
    const args = ['HELLO'];

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
    server: string,
    _: never,
    version: string,
    _: never,
    proto: number,
    _: never,
    id: number,
    _: never,
    mode: string,
    _: never,
    role: string,
    _: never,
    modules: Array<string>
];

interface HelloTransformedReply {
    server: string;
    version: string;
    proto: number;
    id: number;
    mode: string;
    role: string;
    modules: Array<string>;
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
