const symbol = Symbol('Command Options');

export type CommandOptions<T> = T & {
    readonly [symbol]: true;
};

export function commandOptions<T>(options: T): CommandOptions<T> {
    (options as any)[symbol] = true;
    return options as CommandOptions<T>;
}

export function isCommandOptions<T>(options: any): options is CommandOptions<T> {
    return options?.[symbol] === true;
}
