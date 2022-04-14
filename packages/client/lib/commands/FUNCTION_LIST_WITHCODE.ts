import { RedisCommandArguments } from '.';
import { transformArguments as transformFunctionListArguments } from './FUNCTION_LIST';
import { FunctionListItemReply, FunctionListRawItemReply, transformFunctionListItemReply } from './generic-transformers';

export function transformArguments(pattern?: string): RedisCommandArguments {
    const args = transformFunctionListArguments(pattern);
    args.push('WITHCODE');
    return args;
}

type FunctionListWithCodeRawItemReply = [
    ...FunctionListRawItemReply,
    'library_code',
    string
];

interface FunctionListWithCodeItemReply extends FunctionListItemReply {
    libraryCode: string;
}

export function transformReply(reply: Array<FunctionListWithCodeRawItemReply>): Array<FunctionListWithCodeItemReply> {
    return reply.map(library => ({
        ...transformFunctionListItemReply(library as unknown as FunctionListRawItemReply),
        libraryCode: library[7]
    }));
}
