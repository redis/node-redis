import { RedisCommandArgument, RedisCommandArguments } from '../../commands';

const CRLF = '\r\n';

export default function* encodeCommand(args: RedisCommandArguments): IterableIterator<RedisCommandArgument> {
    let strings = `*${args.length}${CRLF}`,
        stringsLength = 0;
    for (const arg of args) {
        if (Buffer.isBuffer(arg)) {
            yield `${strings}$${arg.length}${CRLF}`;
            strings = '';
            stringsLength = 0;
            yield arg;
        } else {
            const string = arg?.toString?.() ?? '',
                byteLength = Buffer.byteLength(string);
            strings += `$${byteLength}${CRLF}`;

            const totalLength = stringsLength + byteLength;
            if (totalLength > 1024) {
                yield strings;
                strings = string;
                stringsLength = byteLength;
            } else {
                strings += string;
                stringsLength = totalLength;
            }
        }

        strings += CRLF;
    }

    yield strings;
}
