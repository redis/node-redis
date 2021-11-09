import { AuthOptions } from './AUTH';

interface MigrateOptions {
    COPY?: true;
    REPLACE?: true;
    AUTH?: AuthOptions;
}

export function transformArguments(
    host: string,
    port: number,
    key: string | Array<string>,
    destinationDb: number,
    timeout: number,
    options?: MigrateOptions
): Array<string> {
    const args = ['MIGRATE', host, port.toString()],
        isKeyString = typeof key === 'string';

    if (isKeyString) {
        args.push(key);
    } else {
        args.push('""');
    }

    args.push(
        destinationDb.toString(),
        timeout.toString()
    );

    if (options?.COPY) {
        args.push('COPY');
    }

    if (options?.REPLACE) {
        args.push('REPLACE');
    }

    if (options?.AUTH) {
        if (options.AUTH.username) {
            args.push(
                'AUTH2',
                options.AUTH.username,
                options.AUTH.password
            );
        } else {
            args.push(
                'AUTH',
                options.AUTH.password
            );
        }
    }

    if (!isKeyString) {
        args.push(
            'KEYS',
            ...key
        );
    }

    return args;
}

export declare function transformReply(): string;
