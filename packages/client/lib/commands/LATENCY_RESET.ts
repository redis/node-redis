import { CommandParser } from '../client/parser'; 
import { Command } from '../RESP/types'; 
import { LATENCY_EVENTS, LatencyEvent } from './LATENCY_GRAPH'; 


export { LATENCY_EVENTS, LatencyEvent };

// This object defines the LATENCY RESET command's behavior for the Redis client.
export default {

    NOT_KEYED_COMMAND: true,


    IS_READ_ONLY: false,

  
    parseCommand(parser: CommandParser, ...events: Array<LatencyEvent>) { 
    
        const args: Array<string> = ['LATENCY', 'RESET'];

    
        if (events.length > 0) {
            args.push(...events);
        }

   
        parser.push(...args);
    },

    transformReply: undefined as unknown as () => number
} as const satisfies Command; 
