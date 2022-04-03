export function transformArguments(): Array<string> {
    return ['TIME'];
}

interface TimeReply extends Date {
    microseconds: number;
}

export function transformReply(reply: [string, string]): TimeReply {
    const seconds = Number(reply[0]),
        microseconds = Number(reply[1]),
        d: Partial<TimeReply> = new Date(seconds * 1000 + microseconds / 1000);
    d.microseconds = microseconds;
    return d as TimeReply;
}
