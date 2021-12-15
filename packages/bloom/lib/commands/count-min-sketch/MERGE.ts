export function transformArguments(dest: string, src: Array<string>, weights?: Array<number>): Array<string> {
    const args = ['CMS.MERGE', dest, src.length.toString(), ...src];
    
    if (weights){
        args.push('WEIGHTS');
        for (const weight of weights) {
            args.push(weight.toString());
        }
    }
   
    return args;
}

export declare function transformReply(): 'OK';
