interface DropIndexOptions {
    DD?: true;
}

export function transformArguments(index: string, options?: DropIndexOptions): Array<string> {
    const args = ['FT.DROPINDEX', index];

    if (options?.DD) {
        args.push('DD');
    }

    return args;
}

export declare function transformReply(): 'OK';
