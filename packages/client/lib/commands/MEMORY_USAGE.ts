export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface MemoryUsageOptions {
    SAMPLES?: number;
}

export function transformArguments(key: string, options?: MemoryUsageOptions): Array<string> {
    const args = ['MEMORY', 'USAGE', key];

    if (options?.SAMPLES) {
        args.push('SAMPLES', options.SAMPLES.toString());
    }

    return args;
}

export declare function transformReply(): number | null;
