import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';

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

function mapLikeEntries(value: any): Array<[string, any]> {
  if (value instanceof Map) {
    return Array.from(value.entries(), ([key, entryValue]) => [key.toString(), entryValue]);
  }

  if (Array.isArray(value)) {
    if (
      value.length === 1 &&
      (Array.isArray(value[0]) || value[0] instanceof Map || (typeof value[0] === 'object' && value[0] !== null))
    ) {
      return mapLikeEntries(value[0]);
    }

    if (value.every(item => Array.isArray(item) && item.length >= 2)) {
      return value.map(item => [item[0].toString(), item[1]]);
    }

    const entries: Array<[string, any]> = [];
    for (let i = 0; i < value.length - 1; i += 2) {
      entries.push([value[i].toString(), value[i + 1]]);
    }
    return entries;
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value);
  }

  return [];
}

function mapLikeValues(value: any): Array<any> {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return [...value.values()];
  if (value !== null && typeof value === 'object') return Object.values(value);
  return [];
}

/**
 * Parse the hotkeys array into HotkeyEntry objects
 */
function parseHotkeysList(arr: unknown): Array<HotkeyEntry> {
  return mapLikeEntries(arr).map(([key, value]) => ({
    key,
    value: Number(value)
  }));
}

/**
 * Parse slot ranges from the server response.
 * Single slots are represented as arrays with one element: [slot]
 * Slot ranges are represented as arrays with two elements: [start, end]
 */
function parseSlotRanges(arr: unknown): Array<SlotRange> {
  return mapLikeValues(arr).map(range => {
    let unwrapped: Array<number>;

    if (Array.isArray(range)) {
      unwrapped = range as Array<number>;
    } else if (range instanceof Map) {
      unwrapped = [...range.values()].map(value => Number(value));
    } else if (range !== null && typeof range === 'object') {
      const objectRange = range as Record<string, unknown>;
      const start = Number(objectRange.start ?? objectRange[0]);
      const end = Number(objectRange.end ?? objectRange[1] ?? start);
      unwrapped = [start, end];
    } else {
      const slot = Number(range);
      unwrapped = [slot, slot];
    }

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
function transformHotkeysGetReply(reply: unknown | null): HotkeysGetReply | null {
  if (reply === null) return null;

  const result: Partial<HotkeysGetReply> = {};
  for (const [key, value] of mapLikeEntries(reply)) {

    switch (key) {
      case 'tracking-active':
        result.trackingActive = Number(value);
        break;
      case 'sample-ratio':
        result.sampleRatio = Number(value);
        break;
      case 'selected-slots':
        result.selectedSlots = parseSlotRanges(value);
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
        result.byCpuTimeUs = parseHotkeysList(value);
        break;
      case 'by-net-bytes':
        result.byNetBytes = parseHotkeysList(value);
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
  transformReply: transformHotkeysGetReply
} as const satisfies Command;
