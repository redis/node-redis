import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

interface XAddOptions {
    NOMKSTREAM?: true;
    TRIM?: {
        strategy?: 'MAXLEN' | 'MINID';
        strategyModifier?: '=' | '~';
        threshold: number;
        limit?: number;
    };
}

export function transformArguments(
    key: RedisCommandArgument,
    id: RedisCommandArgument,
    message: Record<string, RedisCommandArgument>,
    options?: XAddOptions
): RedisCommandArguments {
    const args = ['XADD', key];

    if (options?.NOMKSTREAM) {
        args.push('NOMKSTREAM');
    }

    if (options?.TRIM) {
        if (options.TRIM.strategy) {
            args.push(options.TRIM.strategy);
        }

        if (options.TRIM.strategyModifier) {
            args.push(options.TRIM.strategyModifier);
        }

        args.push(options.TRIM.threshold.toString());

        if (options.TRIM.limit) {
            args.push('LIMIT', options.TRIM.limit.toString());
        }
    }

    args.push(id);

    for (const [key, value] of Object.entries(message)) {
        args.push(key, value);
    }

    return args;
}

export declare function transformReply(): string;
