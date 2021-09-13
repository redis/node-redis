declare module 'cluster-key-slot' {
    export default function calculateSlot(key: string | Buffer): number;
}
