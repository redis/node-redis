import { RediSearchSchema, pushSchema } from '.';

export function transformArguments(index: string, schema: RediSearchSchema): Array<string> {
    const args = ['FT.ALTER', index, 'SCHEMA', 'ADD'];
    pushSchema(args, schema);

    return args;
}

export declare function transformReply(): 'OK';
