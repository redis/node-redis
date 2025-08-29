import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { createClient } from "../../..";

/**
 * Options for the `fireCommandsUntilStopSignal` method
 */
type FireCommandsUntilStopSignalOptions = {
  /**
   * Number of commands to fire in each batch
   */
  batchSize: number;
  /**
   * Timeout between batches in milliseconds
   */
  timeoutMs: number;
  /**
   * Function that creates the commands to be executed
   */
  createCommands: (
    client: ReturnType<typeof createClient<any, any, any, any>>
  ) => Array<() => Promise<unknown>>;
};

export class TestCommandRunner {
  constructor(
    private client: ReturnType<typeof createClient<any, any, any, any>>
  ) {}

  private defaultOptions: FireCommandsUntilStopSignalOptions = {
    batchSize: 60,
    timeoutMs: 10,
    createCommands: (
      client: ReturnType<typeof createClient<any, any, any, any>>
    ) => [
      () => client.set(randomUUID(), Date.now()),
      () => client.get(randomUUID()),
    ],
  };

  #toSettled<T>(p: Promise<T>) {
    return p
      .then((value) => ({ status: "fulfilled" as const, value, error: null }))
      .catch((reason) => ({
        status: "rejected" as const,
        value: null,
        error: reason,
      }));
  }

  async #racePromises<S, T>({
    timeout,
    stopper,
  }: {
    timeout: Promise<S>;
    stopper: Promise<T>;
  }) {
    return Promise.race([
      this.#toSettled<S>(timeout).then((result) => ({
        ...result,
        stop: false,
      })),
      this.#toSettled<T>(stopper).then((result) => ({ ...result, stop: true })),
    ]);
  }

  /**
   * Fires commands until a stop signal is received.
   * @param stopSignalPromise Promise that resolves when the command execution should stop
   * @param options Options for the command execution
   * @returns Promise that resolves when the stop signal is received
   */
  async fireCommandsUntilStopSignal(
    stopSignalPromise: Promise<unknown>,
    options?: Partial<FireCommandsUntilStopSignalOptions>
  ) {
    const executeOptions = {
      ...this.defaultOptions,
      ...options,
    };

    const commandPromises = [];

    while (true) {
      for (let i = 0; i < executeOptions.batchSize; i++) {
        for (const command of executeOptions.createCommands(this.client)) {
          commandPromises.push(this.#toSettled(command()));
        }
      }

      const result = await this.#racePromises({
        timeout: setTimeout(executeOptions.timeoutMs),
        stopper: stopSignalPromise,
      });

      if (result.stop) {
        return {
          commandPromises,
          stopResult: result,
        };
      }
    }
  }
}
