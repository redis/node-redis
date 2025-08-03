import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { LATENCY_EVENTS, LatencyEvent } from './LATENCY_GRAPH';


export { LATENCY_EVENTS, LatencyEvent };


export interface LatencyHistogramOptions {

    buckets?: number[];
}


export interface LatencyHistogramBucket {

    min: number;

    max: number | '+inf';

    count: number;
}


export default {

    NOT_KEYED_COMMAND: true,

    IS_READ_ONLY: true,


    parseCommand(parser: CommandParser, event: LatencyEvent, options?: LatencyHistogramOptions) {

        const args: Array<string> = ['LATENCY', 'HISTOGRAM', event];

        if (options?.buckets && options.buckets.length > 0) {
            args.push('BUCKETS');

            args.push(...options.buckets.map(String));
        }

        parser.push(...args);
    },


    transformReply(reply: Array<[number, number]>): LatencyHistogramBucket[] {
        if (!Array.isArray(reply)) {
            throw new Error('Unexpected reply type for LATENCY HISTOGRAM: expected array.');
        }

        const histogram: LatencyHistogramBucket[] = [];
        for (let i = 0; i < reply.length; i++) {
            const bucket = reply[i];
            if (!Array.isArray(bucket) || bucket.length !== 2 || typeof bucket[0] !== 'number' || typeof bucket[1] !== 'number') {
                console.warn('Skipping malformed latency histogram bucket:', bucket);
                continue;
            }

            const min = bucket[0];
            const count = bucket[1];
            let max: number | '+inf';


            if (i < reply.length - 1) {

                max = reply[i + 1][0];
            } else {

                max = '+inf';
            }

            histogram.push({ min, max, count });
        }

        return histogram;
    }
} as const satisfies Command;
