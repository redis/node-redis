export const FIRST_KEY_INDEX = 0;

export function transformArguments(keys: string | Array<string>, timeout: number): Array<string> {
    const args = ['BLPOP'];

    if (typeof keys === 'string') {
        args.push(keys);
    } else {
        args.push(...keys);
    }

    args.push(timeout.toString());

    return args;
}

type BLPOPReply = [list: string, value: string];

export function transformReply(reply: BLPOPReply): BLPOPReply {
    return reply;
}
