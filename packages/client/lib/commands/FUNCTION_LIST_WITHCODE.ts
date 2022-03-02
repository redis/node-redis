import { RedisCommandArguments } from '.';
import { transformArguments as transformFunctionListArguments } from './FUNCTION_LIST';

export function transformArguments(pattern?: string): RedisCommandArguments {
    const args = transformFunctionListArguments(pattern);
    args.push('WITHCODE');
    return args;
}

