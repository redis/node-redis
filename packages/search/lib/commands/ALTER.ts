import { CreateSchema, pushSchema } from '.';

export function transformArguments(index: string, schema: CreateSchema): Array<string> {
    const args = ['FT.ALTER', index, 'SCHEMA', 'ADD'];
    pushSchema(args, schema);

    return args;
}

export declare function transformReply(): 'OK';
