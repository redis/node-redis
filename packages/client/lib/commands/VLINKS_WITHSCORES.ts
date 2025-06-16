import { BlobStringReply, Command, DoubleReply, MapReply } from '../RESP/types';
import { transformDoubleReply } from './generic-transformers';
import VLINKS from './VLINKS';


function transformVLinksWithScoresReply(reply: any): Array<Record<string, DoubleReply>> {
  const layers: Array<Record<string, DoubleReply>> = [];

  for (const layer of reply) {
    const obj: Record<string, DoubleReply> = Object.create(null);

    // Each layer contains alternating element names and scores
    for (let i = 0; i < layer.length; i += 2) {
      const element = layer[i];
      const score = transformDoubleReply[2](layer[i + 1]);
      obj[element.toString()] = score;
    }

    layers.push(obj);
  }

  return layers;
}

export default {
  IS_READ_ONLY: VLINKS.IS_READ_ONLY,
  /**
   * Get the connections for each layer of the HNSW graph with similarity scores
   * @param args - Same parameters as the VLINKS command
   * @see https://redis.io/commands/vlinks/
   */
  parseCommand(...args: Parameters<typeof VLINKS.parseCommand>) {
    const parser = args[0];

    VLINKS.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: {
    2: transformVLinksWithScoresReply,
    3: undefined as unknown as () => Array<MapReply<BlobStringReply, DoubleReply>>
  }
} as const satisfies Command;
