export interface Composer<T> {
    write(buffer: Buffer): void;

    end(buffer: Buffer): T;

    reset(): void;
}
