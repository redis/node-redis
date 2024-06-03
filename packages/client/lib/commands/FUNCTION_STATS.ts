import { Command, TuplesToMapReply, BlobStringReply, NullReply, NumberReply, MapReply, Resp2Reply, UnwrapReply, SimpleStringReply } from '../RESP/types';
import { isNullReply } from './generic-transformers';

type RunningScript = NullReply | TuplesToMapReply<[
  [SimpleStringReply<'name'>, BlobStringReply],
  [SimpleStringReply<'command'>, BlobStringReply],
  [SimpleStringReply<'duration_ms'>, NumberReply]
]>;

type Engine = TuplesToMapReply<[
  [SimpleStringReply<'libraries_count'>, NumberReply],
  [SimpleStringReply<'functions_count'>, NumberReply]
]>;

type Engines = MapReply<BlobStringReply, Engine>;

type FunctionStatsReply = TuplesToMapReply<[
  [SimpleStringReply<'running_script'>, RunningScript],
  [SimpleStringReply<'engines'>, Engines]
]>;

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['FUNCTION', 'STATS'];
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<FunctionStatsReply>>) => {
      return {
        running_script: transformRunningScript(reply[1]),
        engines: transformEngines(reply[3])
      };
    },
    3: undefined as unknown as () => FunctionStatsReply
  }
} as const satisfies Command;

function transformRunningScript(reply: Resp2Reply<RunningScript>) {
  if (isNullReply(reply)) {
    return null;
  }

  const unwraped = reply as unknown as UnwrapReply<typeof reply>;
  return {
    name: unwraped[1],
    command: unwraped[3],
    duration_ms: unwraped[5]
  };
}

function transformEngines(reply: Resp2Reply<Engines>) {
  const unwraped = reply as unknown as UnwrapReply<typeof reply>;

  const engines: Record<string, {
    libraries_count: NumberReply;
    functions_count: NumberReply;
  }> = Object.create(null);
  for (let i = 0; i < unwraped.length; i++) {
    const name = unwraped[i] as BlobStringReply,
      stats = unwraped[++i] as Resp2Reply<Engine>,
      unwrapedStats = stats as unknown as UnwrapReply<typeof stats>;
    engines[name.toString()] = {
      libraries_count: unwrapedStats[1],
      functions_count: unwrapedStats[3]
    };
  }

  return engines;
}
