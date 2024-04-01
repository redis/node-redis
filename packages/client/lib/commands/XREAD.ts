import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = (
  streams: Array<XReadStream> | XReadStream
): ValkeyCommandArgument => {
  return Array.isArray(streams) ? streams[0].key : streams.key;
};

export const IS_READ_ONLY = true;

interface XReadStream {
  key: ValkeyCommandArgument;
  id: ValkeyCommandArgument;
}

interface XReadOptions {
  COUNT?: number;
  BLOCK?: number;
}

export function transformArguments(
  streams: Array<XReadStream> | XReadStream,
  options?: XReadOptions
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = ["XREAD"];

  if (options?.COUNT) {
    args.push("COUNT", options.COUNT.toString());
  }

  if (typeof options?.BLOCK === "number") {
    args.push("BLOCK", options.BLOCK.toString());
  }

  args.push("STREAMS");

  const streamsArray = Array.isArray(streams) ? streams : [streams],
    argsLength = args.length;
  for (let i = 0; i < streamsArray.length; i++) {
    const stream = streamsArray[i];
    args[argsLength + i] = stream.key;
    args[argsLength + streamsArray.length + i] = stream.id;
  }

  return args;
}

export { transformStreamsMessagesReply as transformReply } from "./generic-transformers";
