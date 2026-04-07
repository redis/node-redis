import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { BlobStringReply, Command, NumberReply, SimpleStringReply, TypeMapping, ReplyUnion } from "@redis/client/dist/lib/RESP/types";
import INFO, { InfoRawReply, InfoRawReplyTypes, InfoReply } from "./INFO";

type chunkType = Array<[
  'startTimestamp',
  NumberReply,
  'endTimestamp',
  NumberReply,
  'samples',
  NumberReply,
  'size',
  NumberReply,
  'bytesPerSample',
  SimpleStringReply
]>;

type InfoDebugRawReply = [
  ...InfoRawReply,
  'keySelfName',
  BlobStringReply,
  'Chunks',
  chunkType
];

export type InfoDebugRawReplyType = InfoRawReplyTypes | chunkType

export interface InfoDebugReply extends InfoReply {
  keySelfName: BlobStringReply,
  chunks: Array<{
    startTimestamp: NumberReply;
    endTimestamp: NumberReply;
    samples: NumberReply;
    size: NumberReply;
    bytesPerSample: SimpleStringReply;
  }>;
}

function mapLikeToObject(value: unknown): Record<string, any> {
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries(), ([key, entryValue]) => [key.toString(), entryValue])
    );
  }

  if (Array.isArray(value)) {
    const object: Record<string, any> = {};
    for (let i = 0; i < value.length - 1; i += 2) {
      object[value[i].toString()] = value[i + 1];
    }
    return object;
  }

  if (value !== null && typeof value === 'object') {
    return value as Record<string, any>;
  }

  return {};
}

function mapLikeValues(value: unknown): Array<any> {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return [...value.values()];
  if (value !== null && typeof value === 'object') return Object.values(value);
  return [];
}

function normalizeChunks(chunks: unknown): InfoDebugReply['chunks'] {
  return mapLikeValues(chunks).map(chunk => {
    if (Array.isArray(chunk)) {
      if (chunk.length >= 10 && chunk[0] === 'startTimestamp') {
        return {
          startTimestamp: chunk[1],
          endTimestamp: chunk[3],
          samples: chunk[5],
          size: chunk[7],
          bytesPerSample: chunk[9].toString()
        };
      }

      return {
        startTimestamp: chunk[0],
        endTimestamp: chunk[1],
        samples: chunk[2],
        size: chunk[3],
        bytesPerSample: chunk[4].toString()
      };
    }

    const object = mapLikeToObject(chunk);
    return {
      startTimestamp: object.startTimestamp ?? object.start_timestamp,
      endTimestamp: object.endTimestamp ?? object.end_timestamp,
      samples: object.samples,
      size: object.size,
      bytesPerSample: (object.bytesPerSample ?? object.bytes_per_sample).toString()
    };
  });
}

export default {
  IS_READ_ONLY: INFO.IS_READ_ONLY,
  /**
   * Gets debug information about a time series
   * @param parser - The command parser
   * @param key - The key name of the time series
   */
  parseCommand(parser: CommandParser, key: string) {
    INFO.parseCommand(parser, key);
    parser.push('DEBUG');
  },
  transformReply: {
    2: (reply: InfoDebugRawReply, _, typeMapping?: TypeMapping): InfoDebugReply => {
      const ret = INFO.transformReply[2](reply as unknown as InfoRawReply, _, typeMapping) as any;

      for (let i=0; i < reply.length; i += 2) {
        const key = (reply[i] as any).toString();

        switch (key) {
          case 'keySelfName': {
            ret[key] = reply[i+1];
            break;
          }
          case 'Chunks': {
            ret['chunks'] = (reply[i+1] as chunkType).map(
              chunk => ({
                startTimestamp: chunk[1],
                endTimestamp: chunk[3],
                samples: chunk[5],
                size: chunk[7],
                bytesPerSample: chunk[9]
              })
            );
            break;
          }
        }
      }

      return ret;
    },
    3: (reply: ReplyUnion, preserve?: unknown, typeMapping?: TypeMapping): InfoDebugReply => {
      const ret = INFO.transformReply[3](reply, preserve, typeMapping) as InfoDebugReply;
      const mappedReply = mapLikeToObject(reply);

      ret.keySelfName = mappedReply.keySelfName ?? mappedReply.key_self_name;

      const chunks = mappedReply.Chunks ?? mappedReply.chunks;
      ret.chunks = normalizeChunks(chunks);

      return ret;
    }
  },
} as const satisfies Command;
