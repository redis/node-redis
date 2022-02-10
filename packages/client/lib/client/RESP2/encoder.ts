import { RedisCommandArgument, RedisCommandArguments } from '../../commands';

const CRLF = '\r\n';

export default function encodeCommand(args: RedisCommandArguments): Array<RedisCommandArgument> {
    const toWrite: Array<RedisCommandArgument> = [];

    let strings = `*${args.length}${CRLF}`;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === 'string') {
            const byteLength = Buffer.byteLength(arg);
            strings += `$${byteLength}${CRLF}`;
            strings += arg;
        } else if (arg instanceof Buffer) {
            toWrite.push(`${strings}$${arg.length}${CRLF}`);
            strings = '';
            toWrite.push(arg);
        } else {
            throw new TypeError('Invalid argument type');
        }

        strings += CRLF;
    }

    toWrite.push(strings);

    return toWrite;
}
