export type CommandOptions<T> = T & {
    options: never;
};

const set = new WeakSet();

export function commandOptions<T extends object>(options: T): CommandOptions<T> {
    set.add(options);
    return options as CommandOptions<T>;
}

export function isCommandOptions<T extends object>(options: any): options is CommandOptions<T> {
    return set.delete(options);
}
