import type { MessageTracker } from "./message-tracker";
import { Cluster } from "./test.util";
import { setTimeout } from "timers/promises";

/**
 * Options for the `publishMessagesUntilAbortSignal` method
 */
interface PublishMessagesUntilAbortSignalOptions {
  /**
   * Number of messages to publish in each batch
   */
  batchSize: number;
  /**
   * Timeout between batches in milliseconds
   */
  timeoutMs: number;
  /**
   * Function that generates the message content to be published
   */
  createMessage: () => string;
}

/**
 * Utility class for running test commands until a stop signal is received
 */
export class TestCommandRunner {
  private static readonly defaultPublishOptions: PublishMessagesUntilAbortSignalOptions =
    {
      batchSize: 10,
      timeoutMs: 10,
      createMessage: () => Date.now().toString(),
    };

  /**
   * Continuously publishes messages to the given Redis channels until aborted.
   *
   * @param {Redis|Cluster} client - Redis client or cluster instance used to publish messages.
   * @param {string[]} channels - List of channel names to publish messages to.
   * @param {MessageTracker} messageTracker - Tracks sent and failed message counts per channel.
   * @param {Partial<PublishMessagesUntilAbortSignalOptions>} [options] - Optional overrides for batch size, timeout, and message factory.
   * @param {AbortController} [externalAbortController] - Optional external abort controller to control publishing lifecycle.
   * @returns {{ controller: AbortController, result: Promise<void> }}
   * An object containing the abort controller and a promise that resolves when publishing stops.
   */
  static publishMessagesUntilAbortSignal(
    client: Cluster,
    channels: string[],
    messageTracker: MessageTracker,
    options?: Partial<PublishMessagesUntilAbortSignalOptions>,
    externalAbortController?: AbortController,
  ) {
    const publishOptions = {
      ...TestCommandRunner.defaultPublishOptions,
      ...options,
    };

    const abortController = externalAbortController ?? new AbortController();

    const result = async () => {
      while (!abortController.signal.aborted) {
        const batchPromises: Promise<void>[] = [];

        for (let i = 0; i < publishOptions.batchSize; i++) {
          for (const channel of channels) {
            const message = publishOptions.createMessage();

            const publishPromise = client
              .sPublish(channel, message)
              .then(() => {
                messageTracker.incrementSent(channel);
              })
              .catch(() => {
                messageTracker.incrementFailed(channel);
              });

            batchPromises.push(publishPromise);
          }
        }

        await Promise.all(batchPromises);
        await setTimeout(publishOptions.timeoutMs);
      }
    };

    return {
      controller: abortController,
      result: result(),
    };
  }
}
