export function transformArguments(key: string, width: number, depth: number): Array<string> {
    return ['CMS.INITBYDIM', key, width.toString(), depth.toString()];
}

export declare function transformReply(): 'OK';
