export function transformArguments(key: string, topK: number, options?: [width: number, depth: number, decay: number]): Array<string> {
    const args = ['TOPK.RESERVE', key, topK.toString()];
    
    if (options) {
        args.push(options[0].toString());
        args.push(options[1].toString());
        args.push(options[2].toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
