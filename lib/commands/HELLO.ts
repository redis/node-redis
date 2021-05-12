import { AuthOptions, transformArguments as transformAuthArguments } from './AUTH';

export function transformArguments(protover?: number, auth?: AuthOptions): Array<string> {
    const args = ['HELLO'];

    if (protover) {
        args.push(protover.toString());
    }

    if (auth) {
        args.push(...transformAuthArguments(auth));
    }

    return args;
}