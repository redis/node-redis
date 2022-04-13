export function transformArguments(ip: string, port: number): Array<string> {
    return ['CLUSTER', 'MEET', ip, port.toString()];
}

export declare function transformReply(): 'OK';
