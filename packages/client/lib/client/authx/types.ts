/**
 * Disposable is an interface for objects that hold resources that should be released when they are no longer needed.
 */
export type Disposable = {
  dispose: () => void;
};