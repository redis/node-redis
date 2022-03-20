import { RedisCommandArgument, RedisCommandArguments } from '.';

type SingleParameter = [parameter: RedisCommandArgument, value: RedisCommandArgument];

type MultipleParameters = [config: Record<string, RedisCommandArgument>];

export function transformArguments(
    ...[parameterOrConfig, value]: SingleParameter | MultipleParameters
): RedisCommandArguments {
    const args: RedisCommandArguments = ['CONFIG', 'SET'];

    if (typeof parameterOrConfig === 'string') {
        args.push(parameterOrConfig, value!);
    } else {
        for (const [key, value] of Object.entries(parameterOrConfig)) {
            args.push(key, value);
        }
    }

    return args;
}

export declare function transformReply(): string;
