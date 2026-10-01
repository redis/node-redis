import { AbortError, ErrorReply, MultiErrorReply, WatchError } from '../errors';

/** Error-reply codes that report the member's state, not the command's. */
const SERVER_STATE_ERRORS = new Set([
  'LOADING',
  'BUSY',
  'MASTERDOWN',
  'CLUSTERDOWN',
  'READONLY',
  'NOREPLICAS',
  'MISCONF'
]);

/**
 * The default `errorFilter`. An error counts as a failure unless it is about
 * the command or the caller, not the member:
 * - a WATCH conflict or an abort never counts;
 * - an error reply counts only when its code reports server state (`LOADING`,
 *   `BUSY`, `MASTERDOWN`, `CLUSTERDOWN`, `READONLY`, `NOREPLICAS`, `MISCONF`);
 * - a MULTI error counts when any of its replies counts;
 * - anything else (connection errors, timeouts) counts.
 *
 * Compose it to extend the default:
 * `errorFilter: err => defaultErrorFilter(err) || isMine(err)`.
 * @experimental
 */
export function defaultErrorFilter(err: Error): boolean {
  if (err instanceof WatchError || err instanceof AbortError) return false;
  if (err instanceof MultiErrorReply) {
    for (const reply of err.errors()) {
      if (defaultErrorFilter(reply)) return true;
    }
    return false;
  }
  if (err instanceof ErrorReply) {
    return SERVER_STATE_ERRORS.has(err.message.split(' ', 1)[0]);
  }
  return true;
}
