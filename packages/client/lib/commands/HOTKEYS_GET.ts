import { CommandParser } from '../client/parser';
import { Command, ReplyUnion, UnwrapReply, ArrayReply, BlobStringReply, NumberReply } from '../RESP/types';

/**
 * Hotkey entry with key name and metric value
 */
export interface HotkeyEntry {
  key: string;
  value: number;
}

/**
 * Slot range with start and end values
 */
export interface SlotRange {
  start: number;
  end: number;
}

/**
 * HOTKEYS GET response structure
 */
export interface HotkeysGetReply {
  trackingActive: number;
  sampleRatio: number;
  selectedSlots: Array<SlotRange>;
  /** Only present when sample-ratio > 1 AND selected-slots is not empty */
  sampledCommandsSelectedSlotsUs?: number;
  /** Only present when selected-slots is not empty */
  allCommandsSelectedSlotsUs?: number;
  allCommandsAllSlotsUs: number;
  /** Only present when sample-ratio > 1 AND selected-slots is not empty */
  netBytesSampledCommandsSelectedSlots?: number;
  /** Only present when selected-slots is not empty */
  netBytesAllCommandsSelectedSlots?: number;
  netBytesAllCommandsAllSlots: number;
  collectionStartTimeUnixMs: number;
  collectionDurationMs: number;
  totalCpuTimeSysMs: number;
  totalCpuTimeUserMs: number;
  totalNetBytes: number;
  byCpuTimeUs?: Array<HotkeyEntry>;
  byNetBytes?: Array<HotkeyEntry>;
}

type HotkeysGetRawReply = ArrayReply<ArrayReply<BlobStringReply | NumberReply | ArrayReply<BlobStringReply | NumberReply>>>;

/**
 * Parse the hotkeys array into HotkeyEntry objects
 */
function parseHotkeysList(arr: Array<BlobStringReply | NumberReply>): Array<HotkeyEntry> {
  const result: Array<HotkeyEntry> = [];
  for (let i = 0; i < arr.length; i += 2) {
    result.push({
      key: arr[i].toString(),
      value: Number(arr[i + 1])
    });
  }
  return result;
}

/**
 * Parse slot ranges from the server response.
 * Single slots are represented as arrays with one element: [slot]
 * Slot ranges are represented as arrays with two elements: [start, end]
 */
function parseSlotRanges(arr: Array<ArrayReply<NumberReply>>): Array<SlotRange> {
  return arr.map(range => {
    const unwrapped = range as unknown as Array<number>;
    if (unwrapped.length === 1) {
      // Single slot - start and end are the same
      return {
        start: Number(unwrapped[0]),
        end: Number(unwrapped[0])
      };
    }
    // Slot range
    return {
      start: Number(unwrapped[0]),
      end: Number(unwrapped[1])
    };
  });
}

/**
 * Transform the raw reply into a structured object
 */
function transformHotkeysGetReply(reply: UnwrapReply<HotkeysGetRawReply>): HotkeysGetReply {
  const result: Partial<HotkeysGetReply> = {};

  // The reply is wrapped in an extra array, so we need to access reply[0]
  const data = reply[0] as unknown as Array<BlobStringReply | NumberReply | ArrayReply<BlobStringReply | NumberReply>>;

  for (let i = 0; i < data.length; i += 2) {
    const key = data[i].toString();
    const value = data[i + 1];

    switch (key) {
      case 'tracking-active':
        result.trackingActive = Number(value);
        break;
      case 'sample-ratio':
        result.sampleRatio = Number(value);
        break;
      case 'selected-slots':
        result.selectedSlots = parseSlotRanges(value as unknown as Array<ArrayReply<NumberReply>>);
        break;
      case 'sampled-commands-selected-slots-us':
        result.sampledCommandsSelectedSlotsUs = Number(value);
        break;
      case 'all-commands-selected-slots-us':
        result.allCommandsSelectedSlotsUs = Number(value);
        break;
      case 'all-commands-all-slots-us':
        result.allCommandsAllSlotsUs = Number(value);
        break;
      case 'net-bytes-sampled-commands-selected-slots':
        result.netBytesSampledCommandsSelectedSlots = Number(value);
        break;
      case 'net-bytes-all-commands-selected-slots':
        result.netBytesAllCommandsSelectedSlots = Number(value);
        break;
      case 'net-bytes-all-commands-all-slots':
        result.netBytesAllCommandsAllSlots = Number(value);
        break;
      case 'collection-start-time-unix-ms':
        result.collectionStartTimeUnixMs = Number(value);
        break;
      case 'collection-duration-ms':
        result.collectionDurationMs = Number(value);
        break;
      case 'total-cpu-time-sys-ms':
        result.totalCpuTimeSysMs = Number(value);
        break;
      case 'total-cpu-time-user-ms':
        result.totalCpuTimeUserMs = Number(value);
        break;
      case 'total-net-bytes':
        result.totalNetBytes = Number(value);
        break;
      case 'by-cpu-time-us':
        result.byCpuTimeUs = parseHotkeysList(value as unknown as Array<BlobStringReply | NumberReply>);
        break;
      case 'by-net-bytes':
        result.byNetBytes = parseHotkeysList(value as unknown as Array<BlobStringReply | NumberReply>);
        break;
    }
  }

  return result as HotkeysGetReply;
}

/**
 * HOTKEYS GET command - returns hotkeys tracking data
 *
 * State transitions:
 * - ACTIVE -> returns data (does not stop)
 * - STOPPED -> returns data
 * - EMPTY -> returns null
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the top K hotkeys by CPU time and network bytes.
   * Returns null if no tracking has been started or tracking was reset.
   * @param parser - The Redis command parser
   * @see https://redis.io/commands/hotkeys-get/
   */
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'GET');
  },
  transformReply: {
    2: (reply: UnwrapReply<HotkeysGetRawReply> | null): HotkeysGetReply | null => {
      if (reply === null) return null;
      return transformHotkeysGetReply(reply);
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;
